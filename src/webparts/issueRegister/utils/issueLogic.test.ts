import { getIssueLevel, calculateIssueScore, canCloseIssue, isTargetDateValid } from "./issueLogic";

describe("getIssueLevel", () => {
  it("classifies scores at the documented thresholds", () => {
    expect(getIssueLevel(625)).toBe("Critical");
    expect(getIssueLevel(400)).toBe("Critical");
    expect(getIssueLevel(399)).toBe("High");
    expect(getIssueLevel(256)).toBe("High");
    expect(getIssueLevel(255)).toBe("Medium");
    expect(getIssueLevel(81)).toBe("Medium");
    expect(getIssueLevel(80)).toBe("Low");
    expect(getIssueLevel(1)).toBe("Low");
    expect(getIssueLevel(0)).toBe("Low");
  });
});

describe("calculateIssueScore", () => {
  it("multiplies all four scoring factors", () => {
    expect(calculateIssueScore(5, 5, 5, 5)).toBe(625);
    expect(calculateIssueScore(1, 1, 1, 1)).toBe(1);
    expect(calculateIssueScore(2, 3, 4, 5)).toBe(120);
  });

  it("returns 0 if any factor is 0", () => {
    expect(calculateIssueScore(0, 5, 5, 5)).toBe(0);
  });
});

describe("canCloseIssue", () => {
  it("allows the exact owner, case-insensitively", () => {
    expect(canCloseIssue("User@Contoso.com", "user@contoso.com")).toBe(true);
    expect(canCloseIssue("user@contoso.com", "USER@CONTOSO.COM")).toBe(true);
  });

  it("tolerates incidental whitespace", () => {
    expect(canCloseIssue(" user@contoso.com ", "user@contoso.com")).toBe(true);
  });

  it("rejects a different user", () => {
    expect(canCloseIssue("other@contoso.com", "user@contoso.com")).toBe(false);
  });

  it("rejects when either email is empty", () => {
    expect(canCloseIssue("", "user@contoso.com")).toBe(false);
    expect(canCloseIssue("user@contoso.com", "")).toBe(false);
  });
});

describe("isTargetDateValid", () => {
  it("accepts today and future dates", () => {
    expect(isTargetDateValid("2026-08-01", "2026-08-01")).toBe(true);
    expect(isTargetDateValid("2026-08-02", "2026-08-01")).toBe(true);
  });

  it("rejects past dates", () => {
    expect(isTargetDateValid("2026-07-31", "2026-08-01")).toBe(false);
  });
});