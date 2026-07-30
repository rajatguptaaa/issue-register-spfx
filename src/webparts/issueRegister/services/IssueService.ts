import { SPFI, spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IIssueItem, INewIssueInput, IRecipient } from "../models/IIssueItem";
import "@pnp/sp/fields";

const ISSUE_LIST = "Issue Register List";
const RECIPIENTS_LIST = "IssueNotificationRecipients";

function toIssueItem(spItem: Record<string, unknown>): IIssueItem {
  return {
    ID: spItem.Id as number,
    IssueID: (spItem.IssueID as string) ?? "",
    IssueDomain: spItem.IssueDomain as IIssueItem["IssueDomain"],
    IssueDescription: (spItem.IssueDescription as string) ?? "",
    ThreatValue: (spItem.ThreatValue as number) ?? 0,
    LikelihoodRating: (spItem.LikelihoodRating as number) ?? 0,
    AssetValue: (spItem.AssetValue as number) ?? 0,
    VulnerabilityValue: (spItem.VulnerabilityValue as number) ?? 0,
    IssueScore: (spItem.IssueScore as number) ?? 0,
    ExistingControls: (spItem.ExistingControls as string) ?? "",
    IssueIdentifier: (spItem.IssueIdentifier as string) ?? "",
    TowerMailID: (spItem.TowerMailID as string) ?? "",
    MitigationPlan: (spItem.MitigationPlan as string) ?? "",
    ResidualIssueRating: (spItem.ResidualIssueRating as number) ?? 0,
    TargetDate: spItem.TargetDate as string,
    Remarks: (spItem.Remarks as string) ?? "",
    Status: (spItem.Status as IIssueItem["Status"]) ?? "Open",
    SubmittedBy: (spItem.SubmittedBy as string) ?? "",
    SubmittedOn: spItem.Created as string,
    ClosedDate: (spItem.ClosedDate as string) ?? null,
    ClosedBy: (spItem.ClosedBy as string) ?? null,
    MeetingNotes: (spItem.MeetingNotes as string) ?? "",
  };
}

export class IssueService {
  private sp: SPFI;

  constructor(context: WebPartContext) {
    this.sp = spfi().using(SPFx(context));
  }

  public async getAllIssues(): Promise<IIssueItem[]> {
    const items = await this.sp.web.lists
      .getByTitle(ISSUE_LIST)
      .items.top(500)();
    return items.map(toIssueItem);
  }

  public async getIssueScoresAndStatuses(): Promise<
    Pick<IIssueItem, "IssueScore" | "Status">[]
  > {
    const items = await this.sp.web.lists
      .getByTitle(ISSUE_LIST)
      .items.select("IssueScore", "Status")
      .top(5000)();

    return items.map((i: Record<string, unknown>) => ({
      IssueScore: (i.IssueScore as number) ?? 0,
      Status: (i.Status as IIssueItem["Status"]) ?? "Open",
    }));
  }
  public async addMeetingNote(
    id: number,
    newNote: string,
    displayName: string,
  ): Promise<void> {
    const current = await this.sp.web.lists
      .getByTitle(ISSUE_LIST)
      .items.getById(id)
      .select("MeetingNotes")();

    const existingNotes = (current.MeetingNotes as string) ?? "";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const combined = `[${dateStr} — ${displayName}]: ${newNote}\n\n${existingNotes}`;

    await this.sp.web.lists
      .getByTitle(ISSUE_LIST)
      .items.getById(id)
      .update({ MeetingNotes: combined });
  }

  public async closeIssue(id: number, closedByEmail: string): Promise<void> {
    await this.sp.web.lists.getByTitle(ISSUE_LIST).items.getById(id).update({
      Status: "Closed",
      ClosedDate: new Date().toISOString(),
      ClosedBy: closedByEmail,
    });
  }

  public async getIssueDomainChoices(): Promise<string[]> {
    const field = await this.sp.web.lists
      .getByTitle(ISSUE_LIST)
      .fields.getByInternalNameOrTitle("IssueDomain")
      .select("Choices")();
    return (field as { Choices: string[] }).Choices ?? [];
  }
  public async getIssueById(id: number): Promise<IIssueItem> {
    const item = await this.sp.web.lists
      .getByTitle(ISSUE_LIST)
      .items.getById(id)();
    return toIssueItem(item);
  }

  public async createIssue(input: INewIssueInput): Promise<number> {
    const issueScore =
      input.ThreatValue *
      input.LikelihoodRating *
      input.AssetValue *
      input.VulnerabilityValue;

    const result = await this.sp.web.lists.getByTitle(ISSUE_LIST).items.add({
      IssueDomain: input.IssueDomain,
      IssueDescription: input.IssueDescription,
      ThreatValue: input.ThreatValue,
      LikelihoodRating: input.LikelihoodRating,
      AssetValue: input.AssetValue,
      VulnerabilityValue: input.VulnerabilityValue,
      IssueScore: issueScore,
      ExistingControls: input.ExistingControls,
      IssueIdentifier: input.IssueIdentifier,
      TowerMailID: input.TowerMailID,
      MitigationPlan: input.MitigationPlan,
      ResidualIssueRating: input.ResidualIssueRating,
      TargetDate: input.TargetDate,
      Remarks: input.Remarks,
      Status: "Open",
      SubmittedBy: input.TowerMailID,
    });
    return result.Id;
  }

  public async updateIssueDetails(
    id: number,
    fields: {
      ThreatValue: number;
      LikelihoodRating: number;
      AssetValue: number;
      VulnerabilityValue: number;
      TargetDate: string;
      MitigationPlan: string;
      Remarks: string;
    },
  ): Promise<void> {
    const issueScore =
      fields.ThreatValue *
      fields.LikelihoodRating *
      fields.AssetValue *
      fields.VulnerabilityValue;

    await this.sp.web.lists.getByTitle(ISSUE_LIST).items.getById(id).update({
      ThreatValue: fields.ThreatValue,
      LikelihoodRating: fields.LikelihoodRating,
      AssetValue: fields.AssetValue,
      VulnerabilityValue: fields.VulnerabilityValue,
      IssueScore: issueScore,
      TargetDate: fields.TargetDate,
      MitigationPlan: fields.MitigationPlan,
      Remarks: fields.Remarks,
    });
  }

  public async getActiveRecipients(): Promise<IRecipient[]> {
    const items = await this.sp.web.lists
      .getByTitle(RECIPIENTS_LIST)
      .items.filter("IsActive eq 1")();
    return items.map((i: Record<string, unknown>) => ({
      RecipientName: i.RecipientName as string,
      RecipientEmail: i.RecipientEmail as string,
      RecipientRole: i.RecipientRole as string,
      IsActive: !!i.IsActive,
    }));
  }
}
