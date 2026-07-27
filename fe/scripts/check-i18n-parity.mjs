import {readFileSync} from "node:fs";
import {join} from "node:path";

const sourcePath = join(process.cwd(), "src", "features", "movement", "i18n.ts");
const source = readFileSync(sourcePath, "utf8");
const match = source.match(/export const translationResources = (\{[\s\S]*?\n\} as const);/);

if (!match) {
  throw new Error("Unable to locate translationResources in i18n.ts");
}

const resources = Function(`"use strict"; return (${match[1].replace(/ as const$/, "")});`)();

function flatten(value, prefix = "") {
  if (typeof value === "string") {
    if (!value.trim()) {
      throw new Error(`Empty translation value at ${prefix}`);
    }
    return [prefix];
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid translation node at ${prefix || "(root)"}`);
  }
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

const viKeys = flatten(resources.vi.translation).sort();
const enKeys = flatten(resources.en.translation).sort();
const missingInEn = viKeys.filter((key) => !enKeys.includes(key));
const missingInVi = enKeys.filter((key) => !viKeys.includes(key));

if (missingInEn.length || missingInVi.length) {
  throw new Error(
    [
      missingInEn.length ? `Missing in EN: ${missingInEn.join(", ")}` : "",
      missingInVi.length ? `Missing in VI: ${missingInVi.join(", ")}` : "",
    ].filter(Boolean).join("\n"),
  );
}

console.log(`i18n parity passed: ${viKeys.length} keys`);
