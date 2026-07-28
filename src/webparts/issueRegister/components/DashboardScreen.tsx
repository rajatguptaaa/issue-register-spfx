import * as React from "react";
import { Stack } from "@fluentui/react/lib/Stack";
import { Text } from "@fluentui/react/lib/Text";
import {
  DefaultButton,
  PrimaryButton,
  IconButton,
} from "@fluentui/react/lib/Button";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";
import { useTheme } from "@fluentui/react/lib/Theme";
import { IssueService } from "../services/IssueService";
import { IIssueItem } from "../models/IIssueItem";

export interface IDashboardScreenProps {
  issueService: IssueService;
  onNavigateToAllIssues: (status: "Open" | "Closed", level: IssueLevel | "All") => void;
}

type IssueLevel = "Critical" | "High" | "Medium" | "Low";
type IssueScoreStatus = Pick<IIssueItem, "IssueScore" | "Status">;

function getIssueLevel(score: number): IssueLevel {
  if (score >= 400) return "Critical";
  if (score >= 256) return "High";
  if (score >= 81) return "Medium";
  return "Low";
}

interface ILevelCounts {
  open: number;
  closed: number;
}

const LEVEL_COLORS: Record<IssueLevel, string> = {
  Critical: "#a32d2d",
  High: "#854f0b",
  Medium: "#c7a22b",
  Low: "#3b6d11",
};

const LEVEL_ROW_TINTS: Record<IssueLevel, string> = {
  Critical: "#fbebeb",
  High: "#fdf3e7",
  Medium: "#fbf6e6",
  Low: "#eef4e9",
};

const LEVELS: IssueLevel[] = ["Critical", "High", "Medium", "Low"];

export const DashboardScreen: React.FC<IDashboardScreenProps> = ({ issueService, onNavigateToAllIssues }) => {
  const theme = useTheme();
  const [issues, setIssues] = React.useState<IssueScoreStatus[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadIssues = React.useCallback(() => {
    setLoadError(null);
    setIssues(null);
    issueService
      .getIssueScoresAndStatuses()
      .then(setIssues)
      .catch((err) => {
        setLoadError(
          err instanceof Error ? err.message : "Failed to load issues.",
        );
      });
  }, [issueService]);

  React.useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const counts = React.useMemo<Record<IssueLevel, ILevelCounts>>(() => {
    const base: Record<IssueLevel, ILevelCounts> = {
      Critical: { open: 0, closed: 0 },
      High: { open: 0, closed: 0 },
      Medium: { open: 0, closed: 0 },
      Low: { open: 0, closed: 0 },
    };
    if (!issues) return base;
    issues.forEach((issue) => {
      const level = getIssueLevel(issue.IssueScore);
      if (issue.Status === "Open") base[level].open += 1;
      else base[level].closed += 1;
    });
    return base;
  }, [issues]);

  return (
    <Stack
      tokens={{ padding: 24, childrenGap: 16 }}
      styles={{ root: { maxWidth: 720 } }}
    >
      <Stack horizontal horizontalAlign="space-between" verticalAlign="start">
        <Stack>
          <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
            Issue Summary by Category
          </Text>
          <Text
            variant="medium"
            styles={{ root: { color: theme.palette.neutralSecondary } }}
          >
            Click a count to view related issues.
          </Text>
        </Stack>
        <IconButton
          iconProps={{ iconName: "Refresh" }}
          onClick={loadIssues}
          styles={{
            root: { background: theme.palette.themePrimary, color: "#fff" },
            rootHovered: { background: theme.palette.themeDark, color: "#fff" },
          }}
        />
      </Stack>

      {loadError && (
        <MessageBar messageBarType={MessageBarType.error}>
          {loadError}
        </MessageBar>
      )}

      {!issues && !loadError && (
        <Stack horizontalAlign="center" styles={{ root: { padding: 40 } }}>
          <Spinner size={SpinnerSize.large} label="Loading issues…" />
        </Stack>
      )}

      {issues && (
        <>
          <Stack
            styles={{
              root: {
                border: `1px solid ${theme.palette.neutralLight}`,
                borderRadius: theme.effects.roundedCorner4,
                overflow: "hidden",
              },
            }}
          >
            {/* Header row */}
            <Stack horizontal styles={{ root: { background: "#2b6777" } }}>
              <Stack styles={{ root: { flex: 2, padding: 12 } }}>
                <Text styles={{ root: { color: "#fff", fontWeight: 600 } }}>
                  Issue Level
                </Text>
              </Stack>
              <Stack
                styles={{ root: { flex: 1, padding: 12 } }}
                horizontalAlign="center"
              >
                <Text styles={{ root: { color: "#fff", fontWeight: 600 } }}>
                  Open
                </Text>
              </Stack>
              <Stack
                styles={{ root: { flex: 1, padding: 12 } }}
                horizontalAlign="center"
              >
                <Text styles={{ root: { color: "#fff", fontWeight: 600 } }}>
                  Closed
                </Text>
              </Stack>
            </Stack>

            {/* Data rows */}
            {LEVELS.map((level, index) => (
              <Stack
                horizontal
                key={level}
                styles={{
                  root: {
                    background: LEVEL_ROW_TINTS[level],
                    borderTop:
                      index === 0
                        ? "none"
                        : `1px solid ${theme.palette.neutralLight}`,
                  },
                }}
              >
                <Stack
                  styles={{ root: { flex: 2, padding: 12 } }}
                  verticalAlign="center"
                >
                  <Text
                    styles={{
                      root: { color: LEVEL_COLORS[level], fontWeight: 700 },
                    }}
                  >
                    {level}
                  </Text>
                </Stack>
                <Stack
                  styles={{ root: { flex: 1, padding: 12 } }}
                  horizontalAlign="center"
                  verticalAlign="center"
                >
                  <DefaultButton
                    onClick={() => onNavigateToAllIssues("Open", level)}
                    styles={{
                      root: {
                        minWidth: 120,
                        minHeight: 40,
                        padding: "10px 20px",
                        background: "transparent",
                        border: "none",
                        fontWeight: 700,
                        fontSize: 17,
                        borderRadius: 6,
                      },
                      rootHovered: {
                        background: "rgba(19, 64, 116, 0.08)",
                      },
                    }}
                  >
                    {counts[level].open}
                  </DefaultButton>
                </Stack>
                <Stack
                  styles={{ root: { flex: 1, padding: 12 } }}
                  horizontalAlign="center"
                  verticalAlign="center"
                >
                  <DefaultButton
                    onClick={() => onNavigateToAllIssues("Closed", level)}
                    styles={{
                      root: {
                        minWidth: 120,
                        minHeight: 40,
                        padding: "10px 20px",
                        background: "transparent",
                        border: "none",
                        fontWeight: 700,
                        fontSize: 17,
                        borderRadius: 6,
                      },
                      rootHovered: {
                        background: "rgba(19, 64, 116, 0.08)",
                      },
                    }}
                  >
                    {counts[level].closed}
                  </DefaultButton>
                </Stack>
              </Stack>
            ))}
          </Stack>

          <Text
            variant="small"
            styles={{ root: { color: theme.palette.neutralSecondary } }}
          >
            Issue levels are based on the calculated Issue Score. Critical
            (≥400) | High (256–399) | Medium (81–255) | Low (&lt;81)
          </Text>

          <Stack horizontal tokens={{ childrenGap: 12 }}>
            <PrimaryButton onClick={() => onNavigateToAllIssues("Open", "All")}>
              Open Issues →
            </PrimaryButton>
            <DefaultButton onClick={() => onNavigateToAllIssues("Closed", "All")}>
              Closed Issues →
            </DefaultButton>
          </Stack>
        </>
      )}
    </Stack>
  );
};
