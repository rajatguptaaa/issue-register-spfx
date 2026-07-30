import * as React from "react";
import { Stack } from "@fluentui/react/lib/Stack";
import { Text } from "@fluentui/react/lib/Text";
import { DefaultButton, IconButton } from "@fluentui/react/lib/Button";
import { SearchBox } from "@fluentui/react/lib/SearchBox";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { DatePicker } from "@fluentui/react/lib/DatePicker";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";
import { Icon } from "@fluentui/react/lib/Icon";
import { useTheme } from "@fluentui/react/lib/Theme";
import { IssueService } from "../services/IssueService";
import { IIssueItem, IssueStatus } from "../models/IIssueItem";
import styles from "./IssueRegister.module.scss";

export interface IIssueTableScreenProps {
  issueService: IssueService;
  onViewIssue: (id: number) => void;
}

type IssueLevel = "Critical" | "High" | "Medium" | "Low";
type DateColumn = "targetDate" | "createdDate";

enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

function getIssueLevel(score: number): IssueLevel {
  if (score >= 400) return "Critical";
  if (score >= 256) return "High";
  if (score >= 81) return "Medium";
  return "Low";
}

// Pill-badge colors — a darker text tone paired with a light tint of the
// same hue for the background, the standard enterprise-SaaS status-chip
// pattern (Jira, ServiceNow, Azure DevOps all use this exact approach).
const LEVEL_BADGE: Record<IssueLevel, { fg: string; bg: string }> = {
  Critical: { fg: "#a32d2d", bg: "#fbebeb" },
  High: { fg: "#854f0b", bg: "#fdf3e7" },
  Medium: { fg: "#8a6d1f", bg: "#fbf6e6" },
  Low: { fg: "#3b6d11", bg: "#eef4e9" },
};
const STATUS_BADGE: Record<IssueStatus, { fg: string; bg: string }> = {
  Open: { fg: "#a32d2d", bg: "#fbebeb" },
  Closed: { fg: "#3b6d11", bg: "#eef4e9" },
};

const Badge: React.FC<{ text: string; fg: string; bg: string }> = ({ text, fg, bg }) => (
  <span
    style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 700,
      color: fg,
      background: bg,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </span>
);

const STATUS_OPTIONS: IDropdownOption[] = [
  { key: "All", text: "All" },
  { key: "Open", text: "Open" },
  { key: "Closed", text: "Closed" },
];
const LEVEL_OPTIONS: IDropdownOption[] = [
  { key: "All", text: "All" },
  { key: "Critical", text: "Critical" },
  { key: "High", text: "High" },
  { key: "Medium", text: "Medium" },
  { key: "Low", text: "Low" },
];
const DATE_COLUMN_OPTIONS: IDropdownOption[] = [
  { key: "targetDate", text: "Target Date" },
  { key: "createdDate", text: "Created Date" },
];

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDdMmYyyy(date?: Date): string {
  if (!date) return "";
  const dd = date.getDate() < 10 ? `0${date.getDate()}` : String(date.getDate());
  const mm = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : String(date.getMonth() + 1);
  return `${dd}/${mm}/${date.getFullYear()}`;
}
function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

const WrappingTextCell: React.FC<{ value: string }> = ({ value }) => (
  <div style={{ maxHeight: 90, overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
    <Text>{value || "—"}</Text>
  </div>
);

const FilterField: React.FC<{ label: string; width: number; children: React.ReactNode }> = ({ label, width, children }) => (
  <Stack tokens={{ childrenGap: 4 }} styles={{ root: { width } }}>
    <Text variant="small" styles={{ root: { fontWeight: 600, color: "#201f1e" } }}>{label}</Text>
    {children}
  </Stack>
);

interface IColumnDef {
  key: string;
  header: string;
  defaultWidth: number;
  minWidth: number;
  accessor: (item: IIssueItem) => string | number;
  render: (item: IIssueItem) => React.ReactNode;
}

export const IssueTableScreen: React.FC<IIssueTableScreenProps> = ({ issueService, onViewIssue }) => {
  const theme = useTheme();
  const [issues, setIssues] = React.useState<IIssueItem[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [sortState, setSortState] = React.useState<{ key: string; descending: boolean } | null>(null);

  const [searchText, setSearchText] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"All" | IssueStatus>("All");
  const [levelFilter, setLevelFilter] = React.useState<"All" | IssueLevel>("All");
  const [domainFilter, setDomainFilter] = React.useState<string>("All");
  const [domainOptions, setDomainOptions] = React.useState<IDropdownOption[]>([{ key: "All", text: "All" }]);

  const [dateColumn, setDateColumn] = React.useState<DateColumn>("targetDate");
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = React.useState<Date | undefined>(undefined);

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

  React.useEffect(() => {
    issueService
      .getIssueDomainChoices()
      .then((choices) => setDomainOptions([{ key: "All", text: "All" }, ...choices.map((c) => ({ key: c, text: c }))]))
      .catch(() => {
        /* non-fatal */
      });
  }, [issueService]);

  const columns: IColumnDef[] = [
    { key: "view", header: "", defaultWidth: 70, minWidth: 70, accessor: () => "", render: (item) => (
      <IconButton
        iconProps={{ iconName: "RedEye" }}
        title="View"
        onClick={() => onViewIssue(item.ID)}
        styles={{ root: { color: theme.palette.themePrimary } }}
      />
    ) },
    { key: "issueId", header: "Issue ID", defaultWidth: 100, minWidth: 80, accessor: (i) => i.IssueID || `#${i.ID}`, render: (item) => (
      <Text styles={{ root: { fontWeight: 600, color: theme.palette.themePrimary } }}>{item.IssueID || `#${item.ID}`}</Text>
    ) },
    { key: "domain", header: "Domain", defaultWidth: 160, minWidth: 100, accessor: (i) => i.IssueDomain, render: (item) => <Text>{item.IssueDomain}</Text> },
    {
      key: "level",
      header: "Issue Level",
      defaultWidth: 110,
      minWidth: 90,
      accessor: (i) => i.IssueScore,
      render: (item) => {
        const level = getIssueLevel(item.IssueScore);
        const badge = LEVEL_BADGE[level];
        return <Badge text={level} fg={badge.fg} bg={badge.bg} />;
      },
    },
    { key: "score", header: "Issue Score", defaultWidth: 100, minWidth: 80, accessor: (i) => i.IssueScore, render: (item) => <Text>{item.IssueScore}</Text> },
    { key: "av", header: "Av", defaultWidth: 55, minWidth: 45, accessor: (i) => i.AssetValue, render: (item) => <Text>{item.AssetValue}</Text> },
    { key: "tv", header: "Tv", defaultWidth: 55, minWidth: 45, accessor: (i) => i.ThreatValue, render: (item) => <Text>{item.ThreatValue}</Text> },
    { key: "l", header: "L", defaultWidth: 55, minWidth: 45, accessor: (i) => i.LikelihoodRating, render: (item) => <Text>{item.LikelihoodRating}</Text> },
    { key: "vv", header: "Vv", defaultWidth: 55, minWidth: 45, accessor: (i) => i.VulnerabilityValue, render: (item) => <Text>{item.VulnerabilityValue}</Text> },
    { key: "description", header: "Description", defaultWidth: 240, minWidth: 120, accessor: (i) => i.IssueDescription, render: (item) => <WrappingTextCell value={item.IssueDescription} /> },
    { key: "existingControls", header: "Existing Controls", defaultWidth: 200, minWidth: 120, accessor: (i) => i.ExistingControls, render: (item) => <WrappingTextCell value={item.ExistingControls} /> },
    { key: "residualRating", header: "Residual Rating", defaultWidth: 110, minWidth: 90, accessor: (i) => i.ResidualIssueRating, render: (item) => <Text>{item.ResidualIssueRating}</Text> },
    { key: "mitigationPlan", header: "Mitigation Plan", defaultWidth: 200, minWidth: 120, accessor: (i) => i.MitigationPlan, render: (item) => <WrappingTextCell value={item.MitigationPlan} /> },
    { key: "identifier", header: "Identifier", defaultWidth: 150, minWidth: 100, accessor: (i) => i.IssueIdentifier, render: (item) => <Text>{item.IssueIdentifier}</Text> },
    { key: "owner", header: "Tower Mail ID", defaultWidth: 200, minWidth: 120, accessor: (i) => i.TowerMailID, render: (item) => <Text>{item.TowerMailID}</Text> },
    {
      key: "createdDate",
      header: "Created Date",
      defaultWidth: 110,
      minWidth: 90,
      accessor: (i) => (i.SubmittedOn ? new Date(i.SubmittedOn).getTime() : 0),
      render: (item) => <Text>{formatDate(item.SubmittedOn)}</Text>,
    },
    { key: "targetDate", header: "Target Date", defaultWidth: 110, minWidth: 90, accessor: (i) => (i.TargetDate ? new Date(i.TargetDate).getTime() : 0), render: (item) => <Text>{formatDate(item.TargetDate)}</Text> },
    {
      key: "status",
      header: "Status",
      defaultWidth: 90,
      minWidth: 80,
      accessor: (i) => i.Status,
      render: (item) => {
        const badge = STATUS_BADGE[item.Status];
        return <Badge text={item.Status} fg={badge.fg} bg={badge.bg} />;
      },
    },
    { key: "closedDate", header: "Closed Date", defaultWidth: 110, minWidth: 90, accessor: (i) => (i.ClosedDate ? new Date(i.ClosedDate).getTime() : 0), render: (item) => <Text>{formatDate(item.ClosedDate)}</Text> },
    { key: "closedBy", header: "Closed By", defaultWidth: 180, minWidth: 100, accessor: (i) => i.ClosedBy || "", render: (item) => <Text>{item.ClosedBy || "—"}</Text> },
  ];

  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    columns.forEach((c) => { initial[c.key] = c.defaultWidth; });
    return initial;
  });

  const dragState = React.useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const handleResizeMove = (e: MouseEvent): void => {
    if (!dragState.current) return;
    const { key, startX, startWidth } = dragState.current;
    const col = columns.find((c) => c.key === key);
    const minWidth = col?.minWidth ?? 60;
    const newWidth = Math.max(minWidth, startWidth + (e.clientX - startX));
    setColumnWidths((prev) => ({ ...prev, [key]: newWidth }));
  };
  const handleResizeEnd = (): void => {
    dragState.current = null;
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  };
  const handleResizeStart = (key: string, startWidth: number): ((e: React.MouseEvent) => void) => (e: React.MouseEvent): void => {
    dragState.current = { key, startX: e.clientX, startWidth };
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };
  React.useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
    };
  }, []);

  const dateRangeInvalid = !!(dateFrom && dateTo && startOfDay(dateFrom) > startOfDay(dateTo));
  const hasDateFilter = !!(dateFrom || dateTo);
  const hasOtherFilters = statusFilter !== "All" || levelFilter !== "All" || domainFilter !== "All" || searchText.trim() !== "";
  const hasActiveFilters = hasOtherFilters || (hasDateFilter && !dateRangeInvalid);

  const clearOtherFilters = (): void => {
    setStatusFilter("All");
    setLevelFilter("All");
    setDomainFilter("All");
    setSearchText("");
  };
  const clearDateFilter = (): void => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const filteredIssues = React.useMemo(() => {
    if (!issues) return [];
    const search = searchText.trim().toLowerCase();
    return issues
      .filter((i) => statusFilter === "All" || i.Status === statusFilter)
      .filter((i) => levelFilter === "All" || getIssueLevel(i.IssueScore) === levelFilter)
      .filter((i) => domainFilter === "All" || i.IssueDomain === domainFilter)
      .filter(
        (i) =>
          !search ||
          (i.IssueID || "").toLowerCase().indexOf(search) !== -1 ||
          i.IssueDomain.toLowerCase().indexOf(search) !== -1,
      )
      .filter((i) => {
        if (!hasDateFilter || dateRangeInvalid) return true;
        const rawDate = dateColumn === "targetDate" ? i.TargetDate : i.SubmittedOn;
        if (!rawDate) return false;
        const value = startOfDay(new Date(rawDate));
        if (dateFrom && value < startOfDay(dateFrom)) return false;
        if (dateTo && value > startOfDay(dateTo)) return false;
        return true;
      });
  }, [issues, statusFilter, levelFilter, domainFilter, searchText, dateColumn, dateFrom, dateTo, hasDateFilter, dateRangeInvalid]);

  const sortedIssues = React.useMemo(() => {
    if (!sortState) return filteredIssues;
    const col = columns.find((c) => c.key === sortState.key);
    if (!col) return filteredIssues;
    const sorted = [...filteredIssues].sort((a, b) => compareValues(col.accessor(a), col.accessor(b)));
    return sortState.descending ? sorted.reverse() : sorted;
  }, [filteredIssues, sortState]);

  const handleHeaderClick = (key: string): void => {
    if (key === "view") return;
    setSortState((prev) => (prev && prev.key === key ? { key, descending: !prev.descending } : { key, descending: false }));
  };

  return (
    <Stack tokens={{ padding: 24, childrenGap: 18 }} styles={{ root: { maxWidth: "100%", minWidth: 0, overflow: "hidden" } }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
          <Icon iconName="Table" styles={{ root: { fontSize: 22, color: theme.palette.themePrimary } }} />
          <Text variant="xLarge" styles={{ root: { fontWeight: 700 } }}>
            All Issues
          </Text>
          {issues && (
            <Badge text={`${sortedIssues.length}${hasActiveFilters ? " · filtered" : ""}`} fg={theme.palette.themePrimary} bg="#eaf1f7" />
          )}
        </Stack>
        <DefaultButton onClick={loadIssues} styles={{ root: { height: 34 } }}>
          <Icon iconName="Refresh" styles={{ root: { marginRight: 6, fontSize: 14 } }} />
          Refresh
        </DefaultButton>
      </Stack>

      <Stack
        tokens={{ childrenGap: 16, padding: 20 }}
        styles={{
          root: {
            background: "#ffffff",
            border: `1px solid ${theme.palette.neutralLight}`,
            borderRadius: 8,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          },
        }}
      >
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Icon iconName="Filter" styles={{ root: { fontSize: 16, color: theme.palette.themePrimary } }} />
          <Text variant="mediumPlus" styles={{ root: { fontWeight: 700, color: theme.palette.themePrimary } }}>
            Filters
          </Text>
        </Stack>

        <Stack horizontal wrap tokens={{ childrenGap: 20 }}>
          <FilterField label="Status" width={130}>
            <Dropdown selectedKey={statusFilter} options={STATUS_OPTIONS} onChange={(_, o) => o && setStatusFilter(o.key as "All" | IssueStatus)} />
          </FilterField>
          <FilterField label="Issue Level" width={150}>
            <Dropdown selectedKey={levelFilter} options={LEVEL_OPTIONS} onChange={(_, o) => o && setLevelFilter(o.key as "All" | IssueLevel)} />
          </FilterField>
          <FilterField label="Domain" width={200}>
            <Dropdown selectedKey={domainFilter} options={domainOptions} onChange={(_, o) => o && setDomainFilter(String(o.key))} />
          </FilterField>
          <FilterField label="Search" width={260}>
            <SearchBox placeholder="Search by Issue ID or Domain…" value={searchText} onChange={(_, v) => setSearchText(v ?? "")} />
          </FilterField>
          {hasOtherFilters && (
            <Stack verticalAlign="end" styles={{ root: { paddingBottom: 1 } }}>
              <DefaultButton onClick={clearOtherFilters} styles={{ root: { height: 32 } }}>
                <Icon iconName="Cancel" styles={{ root: { marginRight: 6, fontSize: 11 } }} />
                Clear
              </DefaultButton>
            </Stack>
          )}
        </Stack>

        <Stack styles={{ root: { height: 1, background: theme.palette.neutralLighter } }} />

        <Stack horizontal wrap tokens={{ childrenGap: 20 }}>
          <FilterField label="Date Column" width={150}>
            <Dropdown selectedKey={dateColumn} options={DATE_COLUMN_OPTIONS} onChange={(_, o) => o && setDateColumn(o.key as DateColumn)} />
          </FilterField>
          <FilterField label="From" width={150}>
            <DatePicker firstDayOfWeek={DayOfWeek.Monday} value={dateFrom} onSelectDate={(d) => setDateFrom(d ?? undefined)} formatDate={formatDdMmYyyy} />
          </FilterField>
          <Stack verticalAlign="end" styles={{ root: { height: 54 } }}>
            <Text styles={{ root: { color: "#605e5c" } }}>to</Text>
          </Stack>
          <FilterField label="To" width={150}>
            <DatePicker firstDayOfWeek={DayOfWeek.Monday} value={dateTo} onSelectDate={(d) => setDateTo(d ?? undefined)} formatDate={formatDdMmYyyy} />
          </FilterField>
          {hasDateFilter && (
            <Stack verticalAlign="end" styles={{ root: { paddingBottom: 1 } }}>
              <DefaultButton onClick={clearDateFilter} styles={{ root: { height: 32 } }}>
                <Icon iconName="Cancel" styles={{ root: { marginRight: 6, fontSize: 11 } }} />
                Dates
              </DefaultButton>
            </Stack>
          )}
        </Stack>

        {dateRangeInvalid && (
          <MessageBar messageBarType={MessageBarType.warning}>
            &quot;From&quot; date must be on or before the &quot;To&quot; date — this date filter is currently being ignored.
          </MessageBar>
        )}
      </Stack>

      {loadError && <MessageBar messageBarType={MessageBarType.error}>{loadError}</MessageBar>}

      {!issues && !loadError && (
        <Stack horizontalAlign="center" tokens={{ childrenGap: 12, padding: 48 }}>
          <Spinner size={SpinnerSize.large} />
          <Text styles={{ root: { color: theme.palette.neutralSecondary } }}>Loading issues…</Text>
        </Stack>
      )}

      {issues && sortedIssues.length === 0 && (
        <Stack horizontalAlign="center" tokens={{ childrenGap: 8, padding: 48 }}>
          <Icon iconName="SearchIssue" styles={{ root: { fontSize: 32, color: theme.palette.neutralTertiary } }} />
          <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>No matching issues</Text>
          <Text styles={{ root: { color: theme.palette.neutralSecondary } }}>Try adjusting or clearing your filters.</Text>
        </Stack>
      )}

      {issues && sortedIssues.length > 0 && (
        <div
          style={{
            overflow: "auto",
            maxHeight: 600,
            width: "100%",
            minWidth: 0,
            border: `1px solid ${theme.palette.neutralLight}`,
            borderRadius: 8,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <table style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed", width: "max-content" }}>
            <colgroup>
              {columns.map((col) => (
                <col key={col.key} style={{ width: columnWidths[col.key] }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                      background: "#2b6777",
                      padding: "12px 12px",
                      textAlign: "left",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 13,
                      letterSpacing: 0.3,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <span onClick={() => handleHeaderClick(col.key)} style={{ cursor: col.key === "view" ? "default" : "pointer" }}>
                      {col.header}
                      {sortState?.key === col.key && (
                        <Icon
                          iconName={sortState.descending ? "ChevronDown" : "ChevronUp"}
                          styles={{ root: { marginLeft: 6, fontSize: 10 } }}
                        />
                      )}
                    </span>
                    <div
                      onMouseDown={handleResizeStart(col.key, columnWidths[col.key])}
                      style={{ position: "absolute", right: 0, top: 0, height: "100%", width: 6, cursor: "col-resize", userSelect: "none" }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedIssues.map((item, index) => (
                <tr key={item.ID} className={styles.tableRow} style={{ background: index % 2 === 0 ? "#ffffff" : "#faf9f8" }}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: "10px 12px", borderTop: `1px solid ${theme.palette.neutralLighter}`, verticalAlign: "middle" }}>
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Stack>
  );
};