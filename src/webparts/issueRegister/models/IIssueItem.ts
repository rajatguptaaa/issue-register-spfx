export type IssueDomain =
  | "IT Security" | "Infrastructure" | "Operations" | "Compliance"
  | "Data Management" | "Network" | "Application" | "Vendor/Third Party"
  | "Business Continuity" | "Storage" | "Backup & Recovery" | "Cloud"
  | "Security" | "Server" | "Other";

export type IssueStatus = "Open" | "Closed";

/**
 * Maps 1:1 to columns on "Issue Register List". Field order here
 * matches the exact order fields appear on the Register Issue form.
 */
export interface IIssueItem {
  ID: number;
  IssueID: string;               // e.g. "ISS-0001", filled by Power Automate
  IssueDomain: IssueDomain;
  IssueDescription: string;
  ThreatValue: number;           // Tv, 1-5
  LikelihoodRating: number;      // L, 1-5
  AssetValue: number;            // Av, 1-5
  VulnerabilityValue: number;    // Vv, 1-5
  IssueScore: number;            // Tv x L x Av x Vv, max 625
  ExistingControls: string;      // optional
  IssueIdentifier: string;
  TowerMailID: string;           // owner email, auto-captured on submit
  MitigationPlan: string;
  ResidualIssueRating: number;   // 0-5
  TargetDate: string;            // ISO date string
  Remarks: string;               // optional
  Status: IssueStatus;
  SubmittedBy: string;
  SubmittedOn: string;           // SharePoint's built-in "Created" field
  ClosedDate?: string;
  ClosedBy?: string;
  MeetingNotes: string;
}

/** Shape the Register Issue form sends when creating a new item. */
export type INewIssueInput = Omit<
  IIssueItem,
  "ID" | "IssueID" | "IssueScore" | "Status" | "SubmittedBy" | "SubmittedOn" | "ClosedDate" | "ClosedBy" | "MeetingNotes"
>;

export interface IRecipient {
  RecipientName: string;
  RecipientEmail: string;
  RecipientRole: string;
  IsActive: boolean;
}