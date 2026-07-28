import * as React from "react";
import { Stack } from "@fluentui/react/lib/Stack";
import { Text } from "@fluentui/react/lib/Text";
import { TextField } from "@fluentui/react/lib/TextField";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { DatePicker } from "@fluentui/react/lib/DatePicker";
import { DayOfWeek } from "@fluentui/react";
import { PrimaryButton, DefaultButton } from "@fluentui/react/lib/Button";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";
import { Icon } from "@fluentui/react/lib/Icon";
import { useTheme } from "@fluentui/react/lib/Theme";
import { IssueService } from "../services/IssueService";
import styles from "./IssueRegister.module.scss";
import { IssueDomain } from "../models/IIssueItem";

export interface IRegisterIssueScreenProps {
  onBack: () => void;
  currentUserEmail: string;
  issueService: IssueService;
}

const SCALE_OPTIONS: IDropdownOption[] = [1, 2, 3, 4, 5].map((n) => ({
  key: n,
  text: String(n),
}));
const RESIDUAL_SCALE_OPTIONS: IDropdownOption[] = [0, 1, 2, 3, 4, 5].map(
  (n) => ({ key: n, text: String(n) }),
);

interface IRegisterFormState {
  issueDomain: IssueDomain | "";
  issueDescription: string;
  threatValue: string;
  likelihoodRating: string;
  assetValue: string;
  vulnerabilityValue: string;
  existingControls: string;
  issueIdentifier: string;
  towerMailId: string;
  mitigationPlan: string;
  residualIssueRating: string;
  targetDate: string;
  remarks: string;
}

const EMPTY_FORM: Omit<IRegisterFormState, "towerMailId"> = {
  issueDomain: "",
  issueDescription: "",
  threatValue: "",
  likelihoodRating: "",
  assetValue: "",
  vulnerabilityValue: "",
  existingControls: "",
  issueIdentifier: "",
  mitigationPlan: "",
  residualIssueRating: "",
  targetDate: "",
  remarks: "",
};

type FieldName = keyof IRegisterFormState;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPTIONAL_FIELDS: FieldName[] = ["existingControls", "remarks"];

function validateField(
  field: FieldName,
  value: string,
  todayIso: string,
): string {
  if (OPTIONAL_FIELDS.indexOf(field) !== -1) return "";
  if (!value.trim()) return "This field is required.";
  if (field === "towerMailId" && !EMAIL_REGEX.test(value))
    return "Enter a valid email address.";
  if (field === "targetDate" && value < todayIso)
    return "Target date must be today or a future date.";
  return "";
}

function isoToDate(iso: string): Date | undefined {
  return iso ? new Date(`${iso}T00:00:00`) : undefined;
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

export const RegisterIssueScreen: React.FC<IRegisterIssueScreenProps> = ({
  onBack,
  currentUserEmail,
  issueService,
}) => {
  const theme = useTheme();
  const [form, setForm] = React.useState<IRegisterFormState>(() => ({
    ...EMPTY_FORM,
    towerMailId: currentUserEmail,
  }));
  const [touched, setTouched] = React.useState<Partial<Record<FieldName, boolean>>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submittedId, setSubmittedId] = React.useState<number | null>(null);

  const [domainOptions, setDomainOptions] = React.useState<IDropdownOption[] | null>(null);
  const [domainLoadError, setDomainLoadError] = React.useState<string | null>(null);

  // Fetches the live list of Issue Domain choices directly from
  // SharePoint's Choice column — runs once when this screen mounts.
  React.useEffect(() => {
    issueService
      .getIssueDomainChoices()
      .then((choices) => setDomainOptions(choices.map((c) => ({ key: c, text: c }))))
      .catch((err: unknown) =>
        setDomainLoadError(err instanceof Error ? err.message : "Failed to load domain list."),
      );
  }, [issueService]);

  const todayIso = React.useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = `0${now.getMonth() + 1}`.slice(-2);
    const day = `0${now.getDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
  }, []);

  const errors: Partial<Record<FieldName, string>> = {};
  (Object.keys(form) as FieldName[]).forEach((field) => {
    if (touched[field])
      errors[field] = validateField(field, form[field], todayIso);
  });

  const isFormValid = (Object.keys(form) as FieldName[]).every(
    (field) => validateField(field, form[field], todayIso) === "",
  );

  const markTouched = (field: FieldName): void => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };
  const markAllTouched = (): void => {
    const allTouched: Partial<Record<FieldName, boolean>> = {};
    (Object.keys(form) as FieldName[]).forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);
  };

  const updateField = <K extends keyof IRegisterFormState>(
    field: K,
    value: IRegisterFormState[K],
  ): void => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = (): void => {
    setForm({ ...EMPTY_FORM, towerMailId: currentUserEmail });
    setTouched({});
    setSubmitError(null);
    setSubmittedId(null);
  };

  const handleSubmit = async (): Promise<void> => {
    markAllTouched();
    if (!isFormValid) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const newId = await issueService.createIssue({
        IssueDomain: form.issueDomain as IssueDomain,
        IssueDescription: form.issueDescription,
        ThreatValue: Number(form.threatValue),
        LikelihoodRating: Number(form.likelihoodRating),
        AssetValue: Number(form.assetValue),
        VulnerabilityValue: Number(form.vulnerabilityValue),
        ExistingControls: form.existingControls,
        IssueIdentifier: form.issueIdentifier,
        TowerMailID: form.towerMailId,
        MitigationPlan: form.mitigationPlan,
        ResidualIssueRating: Number(form.residualIssueRating),
        TargetDate: form.targetDate,
        Remarks: form.remarks,
      });
      setSubmittedId(newId);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting the issue.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const issueScore = React.useMemo(() => {
    const { threatValue, likelihoodRating, assetValue, vulnerabilityValue } =
      form;
    if (!threatValue || !likelihoodRating || !assetValue || !vulnerabilityValue)
      return null;
    return (
      Number(threatValue) *
      Number(likelihoodRating) *
      Number(assetValue) *
      Number(vulnerabilityValue)
    );
  }, [
    form.threatValue,
    form.likelihoodRating,
    form.assetValue,
    form.vulnerabilityValue,
  ]);

  const renderScaleField = (
    field: FieldName,
    label: string,
    helpText: string,
    options: IDropdownOption[] = SCALE_OPTIONS,
  ): React.ReactElement => (
    <Dropdown
      label={label}
      placeholder="-- Select --"
      options={options}
      selectedKey={form[field] === "" ? undefined : Number(form[field])}
      onChange={(_, option) =>
        updateField(field, option ? String(option.key) : "")
      }
      onBlur={() => markTouched(field)}
      errorMessage={errors[field]}
      styles={{ root: { marginBottom: 4 } }}
    />
  );

  return (
    <Stack
      tokens={{ padding: 24, childrenGap: 8 }}
      className={styles.screenPlaceholder}
    >
      {submittedId !== null ? (
        <Stack
          tokens={{ childrenGap: 12, padding: 20 }}
          styles={{
            root: {
              background: theme.palette.themeLighter,
              border: `1px solid ${theme.palette.themeLight}`,
              borderRadius: theme.effects.roundedCorner4,
              maxWidth: 500,
            },
          }}
        >
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
            <Icon
              iconName="CompletedSolid"
              styles={{ root: { color: "#3b6d11", fontSize: 20 } }}
            />
            <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
              Issue submitted successfully
            </Text>
          </Stack>
          <Text>Internal record ID: {submittedId}</Text>
          <Text>
            The official Issue ID (e.g. ISS-0001) will appear shortly once Power
            Automate processes it.
          </Text>
          <Stack horizontal tokens={{ childrenGap: 12 }}>
            <DefaultButton onClick={onBack}>← Back to Home</DefaultButton>
            <PrimaryButton onClick={resetForm}>
              + Submit Another Issue
            </PrimaryButton>
          </Stack>
        </Stack>
      ) : (
        <fieldset disabled={submitting} className={styles.formFieldset}>
          <Stack
            tokens={{ childrenGap: 16 }}
            styles={{ root: { maxWidth: 460 } }}
          >
            <Dropdown
              label="Issue Domain"
              placeholder={domainOptions ? "-- Select --" : "Loading domains…"}
              options={domainOptions ?? []}
              disabled={!domainOptions}
              selectedKey={form.issueDomain || undefined}
              onChange={(_, option) =>
                updateField(
                  "issueDomain",
                  option ? (option.key as IssueDomain) : "",
                )
              }
              onBlur={() => markTouched("issueDomain")}
              errorMessage={errors.issueDomain || domainLoadError || undefined}
            />

            <TextField
              label="Issue Description"
              multiline
              rows={3}
              value={form.issueDescription}
              onChange={(_, v) => updateField("issueDescription", v ?? "")}
              onBlur={() => markTouched("issueDescription")}
              errorMessage={errors.issueDescription}
            />

            {renderScaleField(
              "threatValue",
              "Threat Value (Tv)",
              "1 = very low impact, 5 = very high impact",
            )}
            {renderScaleField(
              "likelihoodRating",
              "Likelihood Rating (L)",
              "1 = rare, 5 = almost certain",
            )}
            {renderScaleField(
              "assetValue",
              "Asset Value (Av)",
              "1 = very low value, 5 = very high value",
            )}
            {renderScaleField(
              "vulnerabilityValue",
              "Vulnerability Value (Vv)",
              "1 = very low, 5 = very high",
            )}

            <Stack
              tokens={{ padding: 12 }}
              styles={{
                root: {
                  background: theme.palette.themeLighter,
                  border: `1px solid ${theme.palette.themeLight}`,
                  borderRadius: theme.effects.roundedCorner4,
                },
              }}
            >
              <Text
                variant="small"
                styles={{ root: { color: theme.palette.neutralSecondary } }}
              >
                Issue Score
              </Text>
              <Text
                variant="xLarge"
                styles={{
                  root: { fontWeight: 700, color: theme.palette.themePrimary },
                }}
              >
                {issueScore === null
                  ? "Select Tv, L, Av, Vv above to calculate"
                  : issueScore}
              </Text>
            </Stack>

            <TextField
              label="Existing Controls (optional)"
              multiline
              rows={2}
              value={form.existingControls}
              onChange={(_, v) => updateField("existingControls", v ?? "")}
            />

            <TextField
              label="Issue Identifier"
              value={form.issueIdentifier}
              onChange={(_, v) => updateField("issueIdentifier", v ?? "")}
              onBlur={() => markTouched("issueIdentifier")}
              errorMessage={errors.issueIdentifier}
            />

            <TextField
              label="Tower Mail ID"
              value={form.towerMailId}
              readOnly
              disabled
            />

            <TextField
              label="Mitigation Plan"
              multiline
              rows={3}
              value={form.mitigationPlan}
              onChange={(_, v) => updateField("mitigationPlan", v ?? "")}
              onBlur={() => markTouched("mitigationPlan")}
              errorMessage={errors.mitigationPlan}
            />

            {renderScaleField(
              "residualIssueRating",
              "Residual Issue Rating",
              "Risk remaining after controls/mitigation. 0 = none, 5 = very high",
              RESIDUAL_SCALE_OPTIONS,
            )}

            <DatePicker
              label="Target Date"
              firstDayOfWeek={DayOfWeek.Monday}
              value={isoToDate(form.targetDate)}
              minDate={isoToDate(todayIso)}
              onSelectDate={(date) => {
                updateField("targetDate", dateToIso(date ?? undefined));
                markTouched("targetDate");
              }}
              formatDate={(date) => (date ? dateToIso(date) : "")}
            />
            {errors.targetDate && (
              <Text
                variant="small"
                styles={{ root: { color: "#a4262c", marginTop: -12 } }}
              >
                {errors.targetDate}
              </Text>
            )}

            <TextField
              label="Remarks (optional)"
              multiline
              rows={2}
              value={form.remarks}
              onChange={(_, v) => updateField("remarks", v ?? "")}
            />

            {submitError && (
              <MessageBar messageBarType={MessageBarType.error}>
                {submitError}
              </MessageBar>
            )}

            <PrimaryButton
              onClick={handleSubmit}
              disabled={submitting}
              styles={{ root: { width: 180, height: 40 } }}
            >
              {submitting ? "Submitting…" : "Submit Issue"}
            </PrimaryButton>
          </Stack>
        </fieldset>
      )}
    </Stack>
  );
};