import * as React from "react";
import { Stack } from "@fluentui/react/lib/Stack";
import { Text } from "@fluentui/react/lib/Text";
import { SearchBox } from "@fluentui/react/lib/SearchBox";
import { IconButton, DefaultButton } from "@fluentui/react/lib/Button";
import { Pivot, PivotItem } from "@fluentui/react/lib/Pivot";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";
import { useTheme } from "@fluentui/react/lib/Theme";
import { IssueService } from "../services/IssueService";
import { IIssueItem, IssueStatus } from "../models/IIssueItem";

export type IssueLevel = "Critical" | "High" | "Medium" | "Low";

export interface IAllIssuesInitialFilter {
  status: IssueStatus;
  level: IssueLevel | "All";
}

export interface IAllIssuesScreenProps {
  issueService: IssueService;
  initialFilter: IAllIssuesInitialFilter;
  onViewIssue: (id: number) => void;
}

function getIssueLevel(score: number): IssueLevel {
  if (score >= 400) return "Critical";
  if (score >= 256) return "High";
  if (score >= 81) return "Medium";
  return "Low";
}

function isOverdue(targetDate: string, status: IssueStatus): boolean {
  if (status === "Closed") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(targetDate) < today;
}

const LEVEL_COLORS: Record<IssueLevel, string> = {
  Critical: "#a32d2d",
  High: "#854f0b",
  Medium: "#c7a22b",
  Low: "#3b6d11",
};

export const AllIssuesScreen: React.FC<IAllIssuesScreenProps> = ({
  issueService,
  initialFilter,
  onViewIssue,
}) => {
  const theme = useTheme();
  const [issues, setIssues] = React.useState<IIssueItem[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [statusTab, setStatusTab] = React.useState<IssueStatus>(initialFilter.status);
  const [levelFilter, setLevelFilter] = React.useState<IssueLevel | "All">(initialFilter.level);
  const [searchText, setSearchText] = React.useState("");

  const loadIssues = React.useCallback(() => {
    setLoadError(null);
    setIssues(null);
    issueService
      .getAllIssues()
      .then(setIssues)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load issues."));
  }, [issueService]);

  React.useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Re-sync the screen's filters whenever a NEW click comes in from
  // Dashboard (e.g. user goes back and clicks a different matrix cell).
  React.useEffect(() => {
    setStatusTab(initialFilter.status);
    setLevelFilter(initialFilter.level);
  }, [initialFilter.status, initialFilter.level]);

  const filteredIssues = React.useMemo(() => {
    if (!issues) return [];
    const search = searchText.trim().toLowerCase();
    return issues
      .filter((issue) => issue.Status === statusTab)
      .filter((issue) => levelFilter === "All" || getIssueLevel(issue.IssueScore) === levelFilter)
      .filter(
        (issue) =>
          !search ||
          issue.IssueID.toLowerCase().indexOf(search) !== -1 ||
          issue.IssueDomain.toLowerCase().indexOf(search) !== -1,
      )
      .sort((a, b) => (a.TargetDate < b.TargetDate ? -1 : a.TargetDate > b.TargetDate ? 1 : 0));
  }, [issues, statusTab, levelFilter, searchText]);

  return (
    <Stack tokens={{ padding: 24, childrenGap: 16 }}>
      {levelFilter !== "All" && (
        <Stack
          horizontal
          horizontalAlign="space-between"
          verticalAlign="center"
          styles={{
            root: {
              background: theme.palette.themeLighter,
              border: `1px solid ${theme.palette.themeLight}`,
              borderRadius: 6,
              padding: "10px 16px",
            },
          }}
        >
          <Text>
            Filtered: <b>{statusTab}</b> issues — <b>{levelFilter}</b> level only
          </Text>
          <DefaultButton onClick={() => setLevelFilter("All")} styles={{ root: { minWidth: 0 } }}>
            Clear
          </DefaultButton>
        </Stack>
      )}

      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Pivot
          selectedKey={statusTab}
          onLinkClick={(item) => item && setStatusTab(item.props.itemKey as IssueStatus)}
        >
          <PivotItem headerText="Open Issues" itemKey="Open" />
          <PivotItem headerText="Closed Issues" itemKey="Closed" />
        </Pivot>
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <SearchBox
            placeholder="Search by Issue ID or Domain…"
            value={searchText}
            onChange={(_, v) => setSearchText(v ?? "")}
            styles={{ root: { width: 260 } }}
          />
          <IconButton
            iconProps={{ iconName: "Refresh" }}
            onClick={loadIssues}
            styles={{
              root: { background: theme.palette.themePrimary, color: "#fff" },
              rootHovered: { background: theme.palette.themeDark, color: "#fff" },
            }}
          />
        </Stack>
      </Stack>

      {loadError && <MessageBar messageBarType={MessageBarType.error}>{loadError}</MessageBar>}

      {!issues && !loadError && (
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Spinner size={SpinnerSize.large} label="Loading issues…" />
        </Stack>
      )}

      {issues && (
        <Stack
          styles={{
            root: {
              border: `1px solid ${theme.palette.neutralLight}`,
              borderRadius: 6,
              overflow: "hidden",
            },
          }}
        >
          <Stack horizontal styles={{ root: { background: "#2b6777" } }}>
            {["Issue ID", "Domain", "Created Date", "Target Date", "Status", ""].map((h) => (
              <Stack key={h} styles={{ root: { flex: h === "" ? "0 0 100px" : 1, padding: 12 } }}>
                <Text styles={{ root: { color: "#fff", fontWeight: 600 } }}>{h}</Text>
              </Stack>
            ))}
          </Stack>

          {filteredIssues.length === 0 && (
            <Stack styles={{ root: { padding: 24 } }} horizontalAlign="center">
              <Text styles={{ root: { color: theme.palette.neutralSecondary } }}>No matching issues.</Text>
            </Stack>
          )}

          {filteredIssues.map((issue, index) => {
            const overdue = isOverdue(issue.TargetDate, issue.Status);
            const level = getIssueLevel(issue.IssueScore);
            return (
              <Stack
                horizontal
                key={issue.ID}
                verticalAlign="center"
                styles={{
                  root: {
                    background: overdue ? "#fbebeb" : index % 2 === 0 ? "#ffffff" : "#fafafa",
                    borderTop: `1px solid ${theme.palette.neutralLighter}`,
                  },
                }}
              >
                <Stack styles={{ root: { flex: 1, padding: 12 } }}>
                  <Text styles={{ root: { color: theme.palette.themePrimary, fontWeight: 700 } }}>
                    {issue.IssueID || `#${issue.ID}`}
                  </Text>
                </Stack>
                <Stack styles={{ root: { flex: 1, padding: 12 } }}>
                  <Text styles={{ root: { color: LEVEL_COLORS[level] } }}>{issue.IssueDomain}</Text>
                </Stack>
                <Stack styles={{ root: { flex: 1, padding: 12 } }}>
                  <Text styles={{ root: { color: overdue ? "#a32d2d" : undefined } }}>
                    {new Date(issue.SubmittedOn).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </Text>
                </Stack>
                <Stack styles={{ root: { flex: 1, padding: 12 } }}>
                  <Text styles={{ root: { color: overdue ? "#a32d2d" : undefined, fontWeight: overdue ? 700 : 400 } }}>
                    {new Date(issue.TargetDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </Text>
                </Stack>
                <Stack styles={{ root: { flex: 1, padding: 12 } }}>
                  <Text styles={{ root: { color: issue.Status === "Open" ? "#a32d2d" : "#3b6d11", fontWeight: 600 } }}>
                    {issue.Status}
                  </Text>
                </Stack>
                <Stack styles={{ root: { flex: "0 0 100px", padding: 8 } }}>
                  <DefaultButton onClick={() => onViewIssue(issue.ID)}>View</DefaultButton>
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};