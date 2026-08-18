export function normalizeFinalAnswerInput(value: string, answerLength: number) {
  return Array.from(value.toUpperCase()).slice(0, Math.max(0, answerLength)).join("");
}
