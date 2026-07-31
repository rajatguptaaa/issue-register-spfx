export type IssueLevel = "Critical" | "High" | "Medium" | "Low";

/**
 * Single source of truth for the Critical/High/Medium/Low thresholds.
 * Previously duplicated across DashboardScreen, AllIssuesScreen,
 * IssueTableScreen, and IssueDetailScreen — consolidating here means
 * a threshold change only ever needs to happen in one place.
 */
export function getIssueLevel(score: number): IssueLevel {
  if (score >= 400) return "Critical";
  if (score >= 256) return "High";
  if (score >= 81) return "Medium";
  return "Low";
}

export const ISSUE_SCORE_MAX = 625; // 5 x 5 x 5 x 5

/**
 * Issue Score = Threat Value x Likelihood x Asset Value x Vulnerability.
 */
export function calculateIssueScore(
  threatValue: number,
  likelihoodRating: number,
  assetValue: number,
  vulnerabilityValue: number,
): number {
  return threatValue * likelihoodRating * assetValue * vulnerabilityValue;
}

/**
 * Only the issue's owner (TowerMailID) may close it. Case-insensitive
 * and whitespace-tolerant, since email casing/stray spaces are not
 * meaningful for identity comparison.
 */
export function canCloseIssue(currentUserEmail: string, towerMailId: string): boolean {
  if (!currentUserEmail || !towerMailId) return false;
  return currentUserEmail.trim().toLowerCase() === towerMailId.trim().toLowerCase();
}

/**
 * "YYYY-MM-DD" for today, in the local timezone — matches the format
 * used throughout the app for date comparisons and <input type="date">.
 */
export function getTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1 < 10 ? `0${now.getMonth() + 1}` : `${now.getMonth() + 1}`;
  const day = now.getDate() < 10 ? `0${now.getDate()}` : `${now.getDate()}`;
  return `${year}-${month}-${day}`;
}

/**
 * Target Date must be today or in the future. Both arguments are plain
 * "YYYY-MM-DD" strings, which sort correctly as text in that format —
 * no need to construct Date objects just for this comparison.
 */
export function isTargetDateValid(targetDateIso: string, todayIso: string): boolean {
  return targetDateIso >= todayIso;
}