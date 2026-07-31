export type IssueLevel = "Critical" | "High" | "Medium" | "Low";

export function getIssueLevel(score: number): IssueLevel {
  if (score >= 400) return "Critical";
  if (score >= 256) return "High";
  if (score >= 81) return "Medium";
  return "Low";
}

export const ISSUE_SCORE_MAX = 625;

export function calculateIssueScore(
  threatValue: number,
  likelihoodRating: number,
  assetValue: number,
  vulnerabilityValue: number,
): number {
  return threatValue * likelihoodRating * assetValue * vulnerabilityValue;
}

export function canCloseIssue(
  currentUserEmail: string,
  towerMailId: string,
): boolean {
  if (!currentUserEmail || !towerMailId) return false;
  return (
    currentUserEmail.trim().toLowerCase() === towerMailId.trim().toLowerCase()
  );
}

export function getTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month =
    now.getMonth() + 1 < 10
      ? `0${now.getMonth() + 1}`
      : `${now.getMonth() + 1}`;
  const day = now.getDate() < 10 ? `0${now.getDate()}` : `${now.getDate()}`;
  return `${year}-${month}-${day}`;
}

export function isTargetDateValid(
  targetDateIso: string,
  todayIso: string,
): boolean {
  return targetDateIso >= todayIso;
}
export function isOverdue(
  targetDateIso: string,
  status: "Open" | "Closed",
): boolean {
  if (status === "Closed") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(targetDateIso) < today;
}
