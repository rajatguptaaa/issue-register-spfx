import { SPFI, spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IIssueItem, INewIssueInput, IRecipient } from "../models/IIssueItem";

const ISSUE_LIST = "Issue Register List";
const RECIPIENTS_LIST = "IssueNotificationRecipients";

/**
 * Converts SharePoint's raw REST payload into the flat IIssueItem shape.
 * "Issue Domain" and "Status" are Choice columns -> SharePoint returns
 * them as { Value: "..." } objects, so those two need unwrapping.
 * Every other column has no spaces in its internal name, so it comes
 * back as a plain value already.
 */
function toIssueItem(spItem: Record<string, unknown>): IIssueItem {
  return {
    ID: spItem.Id as number,
    IssueID: (spItem.IssueID as string) ?? "",
    IssueDomain: (spItem.IssueDomain as { Value: string })
      ?.Value as IIssueItem["IssueDomain"],
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
    Status: ((spItem.Status as { Value: string })?.Value ??
      "Open") as IIssueItem["Status"],
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

  public async getIssueById(id: number): Promise<IIssueItem> {
    const item = await this.sp.web.lists
      .getByTitle(ISSUE_LIST)
      .items.getById(id)();
    return toIssueItem(item);
  }

  /**
   * Creates a new issue. IssueScore is calculated here (Tv x L x Av x Vv)
   * rather than trusting a value from the form, so the score is always
   * correct even if the UI had a bug. IssueID generation and the "new
   * issue" email stay in Power Automate — this call only creates the
   * base item.
   */
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
    });
    return result.Id;
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
