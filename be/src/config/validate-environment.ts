type Environment = Record<string, string | undefined>

const defaultDatabaseUrl =
  'postgresql://postgres:postgres@127.0.0.1:55432/movement'

function requiredProductionValue(env: Environment, key: string): string {
  const value = env[key]?.trim()
  if (!value) {
    throw new Error(`${key} must be set when NODE_ENV=production`)
  }
  return value
}

export function parseCorsOrigin(value: string | undefined): string | string[] {
  const origin = value?.trim()
  if (!origin) {
    return '*'
  }

  const origins = origin
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return origins.length <= 1 ? origins[0] ?? '*' : origins
}

export function buildCorsOrigin(value: string | undefined) {
  const corsOrigins = parseCorsOrigin(value)
  if (corsOrigins === '*') {
    return corsOrigins
  }

  const allowedOrigins = Array.isArray(corsOrigins) ? corsOrigins : [corsOrigins]
  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    callback(null, !origin || allowedOrigins.includes(origin))
  }
}

export function validateEnvironment(env: Environment): Environment {
  if (env.NODE_ENV?.toLowerCase() !== 'production') {
    return env
  }

  const databaseUrl = requiredProductionValue(env, 'DATABASE_URL')
  const jwtSecret = requiredProductionValue(env, 'JWT_SECRET')
  const scoringCode = requiredProductionValue(env, 'SCORING_CODE')
  const corsOrigin = requiredProductionValue(env, 'CORS_ORIGIN')
  const publicFrontendUrl =
    env.FRONTEND_PUBLIC_URL?.trim() ??
    requiredProductionValue(env, 'PUBLIC_FRONTEND_URL')

  if (databaseUrl === defaultDatabaseUrl) {
    throw new Error('DATABASE_URL must not use the development default in production')
  }
  if (jwtSecret === 'change-me') {
    throw new Error('JWT_SECRET must not use the development default in production')
  }
  if (scoringCode === '2468') {
    throw new Error('SCORING_CODE must not use the development default in production')
  }
  const corsOrigins = parseCorsOrigin(corsOrigin)
  const includesWildcard =
    corsOrigins === '*' || (Array.isArray(corsOrigins) && corsOrigins.includes('*'))
  if (includesWildcard) {
    throw new Error('CORS_ORIGIN must not be "*" in production')
  }
  if (!publicFrontendUrl.startsWith('https://')) {
    throw new Error('FRONTEND_PUBLIC_URL must be HTTPS in production')
  }

  return env
}
