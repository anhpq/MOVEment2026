import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const DIST_DIR = new URL('../dist/', import.meta.url)
const MANIFEST_PATH = new URL('../dist/.vite/manifest.json', import.meta.url)
const REPORT_PATH = new URL('../dist/.vite/bundle-budget.json', import.meta.url)
const MAX_INITIAL_GZIP_KIB = readLimit('BUNDLE_MAX_INITIAL_GZIP_KIB', 420)
const MAX_CHUNK_RAW_KIB = readLimit('BUNDLE_MAX_CHUNK_RAW_KIB', 512)
const TEAM_ROUTE_SOURCES = [
  'src/features/movement/layout/ProtectedRoute.tsx',
  'src/features/movement/pages/FinalPage.tsx',
  'src/features/movement/pages/LeaderboardPage.tsx',
  'src/features/movement/pages/StationDetailPage.tsx',
  'src/features/movement/pages/StationListPage.tsx',
  'src/features/movement/pages/StationsMapPage.tsx',
  'src/features/movement/pages/TeamGameplayV2Page.tsx',
]
const DEFERRED_CHUNK_MARKERS = ['admin-qrcode-', 'reactkonva-', 'qrdetect-']

function readLimit(name, fallback) {
  const value = Number(process.env[name] ?? fallback)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`)
  }
  return value
}

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walkFiles(path) : [path]
  })
}

function formatKib(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`
}

function collectStaticManifestKeys(manifest, roots) {
  const visited = new Set()
  const pending = [...roots]

  while (pending.length > 0) {
    const key = pending.pop()
    if (!key || visited.has(key)) continue

    const item = manifest[key]
    if (!item) {
      throw new Error(`Manifest import is missing: ${key}`)
    }

    visited.add(key)
    pending.push(...(item.imports ?? []))
  }

  return visited
}

if (!existsSync(MANIFEST_PATH)) {
  throw new Error('Vite manifest is missing. Run vite build before bundle:check.')
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry)
if (!entryKey) {
  throw new Error('Vite manifest has no application entry.')
}

const initialKeys = collectStaticManifestKeys(manifest, [entryKey])
const initialFiles = [...new Set(
  [...initialKeys]
    .map((key) => manifest[key].file)
    .filter((file) => file.endsWith('.js')),
)]
const initialGzipBytes = initialFiles.reduce(
  (total, file) => total + gzipSync(readFileSync(new URL(`../dist/${file}`, import.meta.url))).byteLength,
  0,
)

const distPath = fileURLToPath(DIST_DIR)
const jsChunks = walkFiles(join(distPath, 'assets'))
  .filter((file) => file.endsWith('.js'))
  .map((file) => {
    const contents = readFileSync(file)
    return {
      file: relative(distPath, file).replaceAll('\\', '/'),
      gzipBytes: gzipSync(contents).byteLength,
      rawBytes: statSync(file).size,
    }
  })
  .sort((left, right) => right.rawBytes - left.rawBytes)

const adminQrFiles = new Set(
  jsChunks
    .filter(({file}) => file.includes('admin-qrcode-'))
    .map(({file}) => file),
)
const teamRouteKeys = Object.keys(manifest).filter((key) =>
  TEAM_ROUTE_SOURCES.includes(manifest[key].src),
)
const missingTeamRouteSources = TEAM_ROUTE_SOURCES.filter((source) =>
  !teamRouteKeys.some((key) => manifest[key].src === source),
)
const teamStaticFiles = new Set(
  [...collectStaticManifestKeys(manifest, teamRouteKeys)]
    .map((key) => manifest[key].file),
)
const adminQrLeaksIntoTeam = [...adminQrFiles].some((file) => teamStaticFiles.has(file))
const deferredChunksInInitial = initialFiles.filter((file) =>
  DEFERRED_CHUNK_MARKERS.some((marker) => file.toLowerCase().includes(marker)),
)
const publicPngPath = new URL('../dist/images/map/suoitien-map.png', import.meta.url)
const largestChunk = jsChunks[0]
const failures = []

if (initialGzipBytes > MAX_INITIAL_GZIP_KIB * 1024) {
  failures.push(
    `Initial static JavaScript is ${formatKib(initialGzipBytes)} (limit ${MAX_INITIAL_GZIP_KIB.toFixed(2)} KiB gzip).`,
  )
}

if (largestChunk && largestChunk.rawBytes > MAX_CHUNK_RAW_KIB * 1024) {
  failures.push(
    `Largest JavaScript chunk is ${formatKib(largestChunk.rawBytes)} raw (limit ${MAX_CHUNK_RAW_KIB.toFixed(2)} KiB).`,
  )
}

if (adminQrFiles.size === 0) {
  failures.push('The dedicated Admin qrcode chunk is missing.')
}

if (missingTeamRouteSources.length > 0) {
  failures.push(`Team route entries are missing from the manifest: ${missingTeamRouteSources.join(', ')}`)
}

if (adminQrLeaksIntoTeam) {
  failures.push('The Admin qrcode chunk is reachable from the Team static request graph.')
}

if (deferredChunksInInitial.length > 0) {
  failures.push(`Heavy deferred chunks leaked into the initial request graph: ${deferredChunksInInitial.join(', ')}`)
}

if (existsSync(publicPngPath)) {
  failures.push('Unused public/images/map/suoitien-map.png was copied into dist.')
}

const report = {
  adminQrFiles: [...adminQrFiles],
  adminQrLeaksIntoTeam,
  deferredChunksInInitial,
  initial: {
    files: initialFiles,
    gzipBytes: initialGzipBytes,
  },
  largestChunks: jsChunks.slice(0, 10),
  limits: {
    maxChunkRawKiB: MAX_CHUNK_RAW_KIB,
    maxInitialGzipKiB: MAX_INITIAL_GZIP_KIB,
  },
  publicPngPresent: existsSync(publicPngPath),
}

writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`)

console.log(
  `Initial static JavaScript: ${formatKib(initialGzipBytes)} gzip across ${initialFiles.length} file(s) ` +
    `(limit ${MAX_INITIAL_GZIP_KIB.toFixed(2)} KiB).`,
)
if (largestChunk) {
  console.log(
    `Largest JavaScript chunk: ${largestChunk.file} · ${formatKib(largestChunk.rawBytes)} raw · ` +
      `${formatKib(largestChunk.gzipBytes)} gzip (raw limit ${MAX_CHUNK_RAW_KIB.toFixed(2)} KiB).`,
  )
}
console.log(`Admin qrcode chunk: ${[...adminQrFiles].join(', ')} (Team graph: isolated).`)
console.log('Deferred map/scanner/Admin QR chunks: absent from initial request graph.')
console.log('Largest chunks:')
for (const chunk of jsChunks.slice(0, 10)) {
  console.log(`  ${chunk.file}: ${formatKib(chunk.rawBytes)} raw · ${formatKib(chunk.gzipBytes)} gzip`)
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`Bundle budget failed: ${failure}`)
  process.exitCode = 1
}
