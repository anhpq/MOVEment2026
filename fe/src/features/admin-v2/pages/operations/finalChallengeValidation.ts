export function isValidOptionalKeywordRotation(value: unknown) {
  return typeof value !== "string" || value.length === 0 || value.trim().length > 0;
}
