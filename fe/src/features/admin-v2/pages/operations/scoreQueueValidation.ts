export function isScoreWithinRange(value: unknown, maxScore: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= maxScore;
}
