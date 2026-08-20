export type AdminV2FinalConfig = Readonly<{
  id: number;
  title: string;
  clueText: string;
  startsAt: string;
  maxWinners: number;
  pointsByRank: readonly number[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}>;

export type AdminV2FinalSubmission = Readonly<{
  id: number;
  answerSubmitted: string;
  isCorrect: boolean;
  winnerRank: number | null;
  pointsAwarded: number;
  submittedAt: string;
  team: Readonly<{id: number; name: string}>;
}>;

export type FinalConfigFormValues = Readonly<{
  title?: string;
  clueText?: string;
  isActive?: boolean;
  answer?: string;
}>;

function string(value: unknown) { return typeof value === "string" ? value : ""; }
function number(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }

export function parseAdminV2FinalConfig(value: unknown): AdminV2FinalConfig | null {
  if (!value || typeof value !== "object") return null;
  const config = value as Record<string, unknown>;
  const id = number(config.id);
  if (typeof config.title !== "string" || typeof config.clueText !== "string" || typeof config.startsAt !== "string") return null;
  const title = config.title;
  const clueText = config.clueText;
  const startsAt = config.startsAt;
  const maxWinners = number(config.maxWinners);
  const pointsByRank = Array.isArray(config.pointsByRank) ? config.pointsByRank.filter((points): points is number => typeof points === "number" && Number.isFinite(points)) : [];
  if (id === null || !startsAt || maxWinners === null || typeof config.isActive !== "boolean") return null;
  return {id, title, clueText, startsAt, maxWinners, pointsByRank, isActive: config.isActive, createdAt: string(config.createdAt) || undefined, updatedAt: string(config.updatedAt) || undefined};
}

function parseSubmission(value: unknown): AdminV2FinalSubmission | null {
  if (!value || typeof value !== "object") return null;
  const submission = value as Record<string, unknown>;
  const team = submission.team;
  if (!team || typeof team !== "object") return null;
  const teamRecord = team as Record<string, unknown>;
  const id = number(submission.id);
  const teamId = number(teamRecord.id);
  const pointsAwarded = number(submission.pointsAwarded);
  if (!(submission.winnerRank === null || typeof submission.winnerRank === "number" && Number.isFinite(submission.winnerRank))) return null;
  if (id === null || teamId === null || pointsAwarded === null || typeof submission.isCorrect !== "boolean" || typeof submission.answerSubmitted !== "string" || typeof submission.submittedAt !== "string" || typeof teamRecord.name !== "string") return null;
  const winnerRank = submission.winnerRank;
  const answerSubmitted = submission.answerSubmitted;
  const submittedAt = string(submission.submittedAt);
  const teamName = teamRecord.name;
  if (!submittedAt) return null;
  return {id, answerSubmitted, isCorrect: submission.isCorrect, winnerRank, pointsAwarded, submittedAt, team: {id: teamId, name: teamName}};
}

export function parseAdminV2FinalSubmissions(value: unknown): readonly AdminV2FinalSubmission[] | null {
  if (!Array.isArray(value)) return null;
  return value.map(parseSubmission).filter((submission): submission is AdminV2FinalSubmission => submission !== null);
}

/** The Backend owns normalization; omit a blank rotation so the stored keyword is preserved. */
export function toFinalConfigUpdate(values: FinalConfigFormValues) {
  const answer = values.answer?.trim() ? values.answer : undefined;
  return {title: values.title, clueText: values.clueText, isActive: values.isActive, ...(answer ? {answer} : {})};
}
