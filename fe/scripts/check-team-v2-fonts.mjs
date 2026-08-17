import {existsSync, readFileSync} from "node:fs";
import {resolve} from "node:path";

const root = process.cwd();
const demoCssPath = resolve(root, "src/features/movement/pages/TeamGameplayV2Demo.css");
const cssPaths = [
  demoCssPath,
  resolve(root, "src/features/movement/pages/TeamGameplayV2Page.css"),
  resolve(root, "src/features/movement/components/TeamV2QrScanner.css"),
  resolve(root, "src/features/movement/components/TeamV2FinalChallenge.css"),
  resolve(root, "src/features/movement/components/TeamV2StationDetailOverlay.css"),
];
const typographyPath = resolve(root, "src/features/movement/pages/teamV2Typography.ts");
const vietnameseFontPath = resolve(root, "src/assets/fonts/space-grotesk-vietnamese.woff2");
const licensesPath = resolve(root, "src/assets/fonts/LICENSES.md");
const errors = [];

const demoCss = readFileSync(demoCssPath, "utf8");
if (!demoCss.includes('--team-v2-font-ui: "Space Grotesk", Aptos, "Segoe UI", sans-serif;')) {
  errors.push("Team V2 UI font token is missing or has the wrong fallback order.");
}
if (!demoCss.includes('--team-v2-font-display: "Oxanium", "Space Grotesk", Aptos, "Segoe UI", sans-serif;')) {
  errors.push("Team V2 display font token is missing or has the wrong fallback order.");
}

for (const cssPath of cssPaths) {
  const css = readFileSync(cssPath, "utf8")
    .replace(/@font-face\s*\{[\s\S]*?\}/g, "")
    .split(/\r?\n/)
    .filter((line) => !line.includes("--team-v2-font-ui:") && !line.includes("--team-v2-font-display:"))
    .join("\n");
  if (/font(?:-family)?\s*:[^;]*(?:Oxanium|Space Grotesk|Aptos|Segoe UI)/i.test(css)) {
    errors.push(`${cssPath} contains a selector-local Team V2 font stack.`);
  }
}

const typographySource = readFileSync(typographyPath, "utf8");
if (!typographySource.includes("TEAM_V2_UI_FONT_FAMILY") || !typographySource.includes("TEAM_V2_DISPLAY_FONT_FAMILY")) {
  errors.push("Konva typography constants are incomplete.");
}
if (!existsSync(vietnameseFontPath)) {
  errors.push("Bundled Space Grotesk Vietnamese font is missing.");
}
if (!readFileSync(licensesPath, "utf8").includes("space-grotesk-vietnamese.woff2")) {
  errors.push("Vietnamese font attribution is missing.");
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Team V2 font guard passed: localized UI uses Space Grotesk tokens.");
