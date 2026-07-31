import * as React from "react";
import { Stack } from "@fluentui/react/lib/Stack";
import { Text } from "@fluentui/react/lib/Text";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { TextField } from "@fluentui/react/lib/TextField";
import { DatePicker } from "@fluentui/react/lib/DatePicker";
import { DayOfWeek } from "@fluentui/react";
import { PrimaryButton, DefaultButton } from "@fluentui/react/lib/Button";
import { Dialog, DialogType, DialogFooter } from "@fluentui/react/lib/Dialog";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";
import { useTheme } from "@fluentui/react/lib/Theme";
import { IssueService } from "../services/IssueService";
import { IIssueItem } from "../models/IIssueItem";
import { IssueLevel, getIssueLevel, canCloseIssue } from "../utils/issueLogic";

export interface IIssueDetailScreenProps {
  issueId: number;
  issueService: IssueService;
  currentUserEmail: string;
  currentUserDisplayName: string;
  onBusyChange?: (busy: boolean) => void;
}

const LEVEL_COLORS: Record<IssueLevel, string> = {
  Critical: "#a32d2d",
  High: "#854f0b",
  Medium: "#c7a22b",
  Low: "#3b6d11",
};

const SCALE_OPTIONS: IDropdownOption[] = [1, 2, 3, 4, 5].map((n) => ({ key: n, text: String(n) }));

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const datePart = iso.split("T")[0];
  return new Date(`${datePart}T00:00:00`);
}
function dateToIso(date: Date | undefined): string {
  if (!date) return "";
  const y = date.getFullYear();
  const monthValue = date.getMonth() + 1;
  const dayValue = date.getDate();
  const m = monthValue < 10 ? `0${monthValue}` : `${monthValue}`;
  const d = dayValue < 10 ? `0${dayValue}` : `${dayValue}`;
  return `${y}-${m}-${d}`;
}

const ReadOnlyField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Stack tokens={{ childrenGap: 4 }}>
    <Text variant="medium" styles={{ root: { fontWeight: 600, color: "#605e5c" } }}>{label}</Text>
    <Text variant="mediumPlus" styles={{ root: { color: "#1a1a1a" } }}>{value || "—"}</Text>
  </Stack>
);

const FieldShell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Stack tokens={{ childrenGap: 6 }} styles={{ root: { width: 220 } }}>
    <Text variant="medium" styles={{ root: { fontWeight: 600, color: "#201f1e" } }}>{label}</Text>
    {children}
  </Stack>
);

const StaticBox: React.FC<{ value: string }> = ({ value }) => (
  <Stack
    verticalAlign="center"
    styles={{
      root: {
        border: "1px solid #c8c6c4",
        borderRadius: 2,
        background: "#f3f2f1",
        padding: "0 10px",
        height: 32,
        boxSizing: "border-box",
      },
    }}
  >
    <Text variant="mediumPlus">{value}</Text>
  </Stack>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const theme = useTheme();
  return (
    <Stack
      tokens={{ childrenGap: 16, padding: 20 }}
      styles={{ root: { background: "#ffffff", border: `1px solid ${theme.palette.neutralLight}`, borderRadius: 8 } }}
    >
      <Text variant="large" styles={{ root: { fontWeight: 700, color: theme.palette.themePrimary } }}>{title}</Text>
      {children}
    </Stack>
  );
};

interface IEditValues {
  threatValue: string;
  likelihoodRating: string;
  assetValue: string;
  vulnerabilityValue: string;
  targetDate: string;
  mitigationPlan: string;
  remarks: string;
}

export const IssueDetailScreen: React.FC<IIssueDetailScreenProps> = ({
  issueId,
  issueService,
  currentUserEmail,
  currentUserDisplayName,
  onBusyChange,
}) => {
  const theme = useTheme();
  const [issue, setIssue] = React.useState<IIssueItem | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<IEditValues | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [noteText, setNoteText] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);
  const [noteError, setNoteError] = React.useState<string | null>(null);

  const [showCloseDialog, setShowCloseDialog] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [closeError, setCloseError] = React.useState<string | null>(null);

  const loadIssue = React.useCallback(() => {
    setLoadError(null);
    issueService
      .getIssueById(issueId)
      .then(setIssue)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load issue."));
  }, [issueId, issueService]);

  React.useEffect(() => {
    setIssue(null);
    loadIssue();
  }, [loadIssue]);

  React.useEffect(() => {
    if (issue) {
      setEditValues({
        threatValue: String(issue.ThreatValue),
        likelihoodRating: String(issue.LikelihoodRating),
        assetValue: String(issue.AssetValue),
        vulnerabilityValue: String(issue.VulnerabilityValue),
        targetDate: issue.TargetDate,
        mitigationPlan: issue.MitigationPlan,
        remarks: issue.Remarks,
      });
    }
  }, [issue]);

  // Blocks header navigation during a field save, a note save, OR closing.
  React.useEffect(() => {
    onBusyChange?.(saving || savingNote || closing);
  }, [saving, savingNote, closing, onBusyChange]);

  const updateEdit = <K extends keyof IEditValues>(field: K, value: string): void => {
    setEditValues((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const liveScore = editValues
    ? Number(editValues.threatValue) *
      Number(editValues.likelihoodRating) *
      Number(editValues.assetValue) *
      Number(editValues.vulnerabilityValue)
    : issue?.IssueScore ?? 0;
  const liveLevel = getIssueLevel(liveScore);

  const handleSave = async (): Promise<void> => {
    if (!editValues) return;
    setSaving(true);
    setSaveError(null);
    try {
      await issueService.updateIssueDetails(issueId, {
        ThreatValue: Number(editValues.threatValue),
        LikelihoodRating: Number(editValues.likelihoodRating),
        AssetValue: Number(editValues.assetValue),
        VulnerabilityValue: Number(editValues.vulnerabilityValue),
        TargetDate: editValues.targetDate,
        MitigationPlan: editValues.mitigationPlan,
        Remarks: editValues.remarks,
      });
      loadIssue();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (): Promise<void> => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    setNoteError(null);
    try {
      await issueService.addMeetingNote(issueId, noteText.trim(), currentUserDisplayName);
      setNoteText("");
      loadIssue();
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Failed to add note.");
    } finally {
      setSavingNote(false);
    }
  };

  const handleConfirmClose = async (): Promise<void> => {
    setClosing(true);
    setCloseError(null);
    try {
      await issueService.closeIssue(issueId, currentUserEmail);
      setShowCloseDialog(false);
      loadIssue();
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : "Failed to close issue.");
    } finally {
      setClosing(false);
    }
  };

  if (loadError) {
    return (
      <Stack tokens={{ padding: 24 }}>
        <MessageBar messageBarType={MessageBarType.error}>{loadError}</MessageBar>
      </Stack>
    );
  }
  if (!issue || !editValues) {
    return (
      <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
        <Spinner size={SpinnerSize.large} label="Loading issue…" />
      </Stack>
    );
  }

  const isOpen = issue.Status === "Open";
  const isOwner = canCloseIssue(currentUserEmail, issue.TowerMailID);
  const issueLabel = issue.IssueID || `#${issue.ID}`;

  return (
    <Stack tokens={{ padding: 24, childrenGap: 24 }} styles={{ root: { maxWidth: 760, margin: "0 auto" } }}>
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }} wrap>
        <Text variant="xLarge" styles={{ root: { fontWeight: 700, color: theme.palette.themePrimary } }}>
          {issueLabel}
        </Text>
        <Text styles={{ root: { color: "#a19f9d" } }}>·</Text>
        <Text variant="large">{issue.IssueDomain}</Text>
        <Text styles={{ root: { color: "#a19f9d" } }}>·</Text>
        <Text variant="large" styles={{ root: { fontWeight: 700, color: LEVEL_COLORS[liveLevel] } }}>
          {liveLevel}
        </Text>
        <Text styles={{ root: { color: "#a19f9d" } }}>·</Text>
        <Text variant="large" styles={{ root: { fontWeight: 700, color: isOpen ? "#a32d2d" : "#3b6d11" } }}>
          {issue.Status}
        </Text>
      </Stack>

      <Stack
        tokens={{ padding: 20, childrenGap: 14 }}
        styles={{ root: { background: "#f0f9fc", border: `1px solid ${theme.palette.themeLight}`, borderRadius: 8 } }}
      >
        <Text variant="medium" styles={{ root: { color: "#605e5c", fontWeight: 600 } }}>Issue Score</Text>
        <Text variant="xxLarge" styles={{ root: { fontWeight: 700, color: LEVEL_COLORS[liveLevel] } }}>
          {liveScore}
        </Text>

        {isOpen ? (
          <Stack horizontal wrap tokens={{ childrenGap: 16 }}>
            <Dropdown
              label="Threat Value (Tv)"
              selectedKey={Number(editValues.threatValue)}
              options={SCALE_OPTIONS}
              onChange={(_, o) => updateEdit("threatValue", o ? String(o.key) : "")}
              disabled={saving}
              styles={{ root: { width: 160 }, label: { fontWeight: 600 } }}
            />
            <Dropdown
              label="Likelihood (L)"
              selectedKey={Number(editValues.likelihoodRating)}
              options={SCALE_OPTIONS}
              onChange={(_, o) => updateEdit("likelihoodRating", o ? String(o.key) : "")}
              disabled={saving}
              styles={{ root: { width: 160 }, label: { fontWeight: 600 } }}
            />
            <Dropdown
              label="Asset Value (Av)"
              selectedKey={Number(editValues.assetValue)}
              options={SCALE_OPTIONS}
              onChange={(_, o) => updateEdit("assetValue", o ? String(o.key) : "")}
              disabled={saving}
              styles={{ root: { width: 160 }, label: { fontWeight: 600 } }}
            />
            <Dropdown
              label="Vulnerability (Vv)"
              selectedKey={Number(editValues.vulnerabilityValue)}
              options={SCALE_OPTIONS}
              onChange={(_, o) => updateEdit("vulnerabilityValue", o ? String(o.key) : "")}
              disabled={saving}
              styles={{ root: { width: 160 }, label: { fontWeight: 600 } }}
            />
          </Stack>
        ) : (
          <Text variant="medium" styles={{ root: { color: "#605e5c" } }}>
            {issue.ThreatValue} (Tv) × {issue.LikelihoodRating} (L) × {issue.AssetValue} (Av) × {issue.VulnerabilityValue} (Vv)
          </Text>
        )}
      </Stack>

      <Section title="Issue Information">
        <ReadOnlyField label="Issue Identifier" value={issue.IssueIdentifier} />
        <ReadOnlyField label="Tower Mail ID" value={issue.TowerMailID} />
        <ReadOnlyField label="Issue Description" value={issue.IssueDescription} />
        <ReadOnlyField label="Existing Controls" value={issue.ExistingControls} />
      </Section>

      <Section title="Timeline">
        <Stack horizontal wrap tokens={{ childrenGap: 24 }}>
          <FieldShell label="Created Date">
            <StaticBox value={formatDate(issue.SubmittedOn)} />
          </FieldShell>
          {isOpen ? (
            <FieldShell label="Target Date">
              <DatePicker
                firstDayOfWeek={DayOfWeek.Monday}
                value={isoToDate(editValues.targetDate)}
                onSelectDate={(date) => updateEdit("targetDate", dateToIso(date ?? undefined))}
                disabled={saving}
              />
            </FieldShell>
          ) : (
            <FieldShell label="Target Date">
              <StaticBox value={formatDate(issue.TargetDate)} />
            </FieldShell>
          )}
        </Stack>
      </Section>

      <Section title="Resolution">
        {isOpen ? (
          <TextField
            label="Mitigation Plan"
            multiline
            rows={3}
            value={editValues.mitigationPlan}
            onChange={(_, v) => updateEdit("mitigationPlan", v ?? "")}
            disabled={saving}
            styles={{ fieldGroup: { fontSize: 15 } }}
          />
        ) : (
          <ReadOnlyField label="Mitigation Plan" value={issue.MitigationPlan} />
        )}
        <ReadOnlyField label="Residual Issue Rating" value={String(issue.ResidualIssueRating)} />
        {isOpen ? (
          <TextField
            label="Remarks (optional)"
            multiline
            rows={2}
            value={editValues.remarks}
            onChange={(_, v) => updateEdit("remarks", v ?? "")}
            disabled={saving}
            styles={{ fieldGroup: { fontSize: 15 } }}
          />
        ) : (
          <ReadOnlyField label="Remarks" value={issue.Remarks} />
        )}
      </Section>

      {issue.Status === "Closed" && (
        <Section title="Closure Info">
          <ReadOnlyField label="Closed Date" value={formatDate(issue.ClosedDate)} />
          <ReadOnlyField label="Closed By" value={issue.ClosedBy ?? "—"} />
        </Section>
      )}

      <Section title="Meeting Notes">
        <Stack
          styles={{
            root: {
              maxHeight: 180,
              overflowY: "auto",
              background: "#faf9f8",
              border: "1px solid #edebe9",
              borderRadius: 6,
              padding: 14,
            },
          }}
          tokens={{ childrenGap: 10 }}
        >
          {issue.MeetingNotes ? (
            issue.MeetingNotes
              .split("\n\n")
              .filter((n) => n.trim())
              .map((note, i) => (
                <Stack key={i} styles={{ root: { paddingBottom: 10, borderBottom: "1px solid #edebe9" } }}>
                  <Text variant="mediumPlus" styles={{ root: { whiteSpace: "pre-wrap" } }}>{note}</Text>
                </Stack>
              ))
          ) : (
            <Text variant="mediumPlus" styles={{ root: { color: "#a19f9d" } }}>No meeting notes yet.</Text>
          )}
        </Stack>

        <TextField
          placeholder="Add a note about this issue…"
          multiline
          rows={2}
          value={noteText}
          onChange={(_, v) => setNoteText(v ?? "")}
          disabled={savingNote}
          styles={{ fieldGroup: { fontSize: 15 } }}
        />
        {noteError && <MessageBar messageBarType={MessageBarType.error}>{noteError}</MessageBar>}
        <DefaultButton onClick={handleAddNote} disabled={savingNote || !noteText.trim()} styles={{ root: { width: 150, height: 36 } }}>
          {savingNote ? "Adding…" : "Add Note"}
        </DefaultButton>
      </Section>

      {isOpen && (
        <Stack horizontal tokens={{ childrenGap: 12 }}>
          <PrimaryButton onClick={handleSave} disabled={saving} styles={{ root: { width: 170, height: 42, fontSize: 15 } }}>
            {saving ? "Saving…" : "Save Changes"}
          </PrimaryButton>

          {isOwner ? (
            <DefaultButton
              onClick={() => setShowCloseDialog(true)}
              disabled={saving}
              styles={{
                root: { width: 160, height: 42, fontSize: 15, color: "#a32d2d", borderColor: "#a32d2d" },
                rootHovered: { color: "#a32d2d", borderColor: "#a32d2d", background: "#fbebeb" },
              }}
            >
              Close Issue
            </DefaultButton>
          ) : (
            <Stack verticalAlign="center">
              <Text variant="small" styles={{ root: { color: "#605e5c" } }}>
                🔒 Only the issue owner (Tower Mail ID) can close this issue
              </Text>
            </Stack>
          )}
        </Stack>
      )}

      {saveError && <MessageBar messageBarType={MessageBarType.error}>{saveError}</MessageBar>}

      <Dialog
        hidden={!showCloseDialog}
        onDismiss={() => !closing && setShowCloseDialog(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: "⚠ Close This Issue?",
          subText: `Are you sure you want to close issue ${issueLabel}? This will mark it as Closed and record today's date and your email as the closer. This cannot be undone from this screen.`,
        }}
      >
        {closeError && <MessageBar messageBarType={MessageBarType.error}>{closeError}</MessageBar>}
        <DialogFooter>
          <PrimaryButton onClick={handleConfirmClose} disabled={closing}>
            {closing ? "Closing…" : "Yes, Close Issue"}
          </PrimaryButton>
          <DefaultButton onClick={() => setShowCloseDialog(false)} disabled={closing}>
            Cancel
          </DefaultButton>
        </DialogFooter>
      </Dialog>
    </Stack>
  );
};