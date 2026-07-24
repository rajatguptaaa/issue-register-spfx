import * as React from "react";
import styles from "./IssueRegister.module.scss";
import { IssueService } from "../services/IssueService";

export interface IRegisterIssueScreenProps {
  onBack: () => void;
  currentUserEmail: string;
  issueService: IssueService;
}

export type IssueDomain =
  | "IT Security"
  | "Infrastructure"
  | "Operations"
  | "Compliance"
  | "Data Management"
  | "Network"
  | "Application"
  | "Vendor/Third Party"
  | "Business Continuity"
  | "Storage"
  | "Backup & Recovery"
  | "Cloud"
  | "Security"
  | "Server"
  | "Other";

const DOMAIN_OPTIONS: IssueDomain[] = [
  "IT Security",
  "Infrastructure",
  "Operations",
  "Compliance",
  "Data Management",
  "Network",
  "Application",
  "Vendor/Third Party",
  "Business Continuity",
  "Storage",
  "Backup & Recovery",
  "Cloud",
  "Security",
  "Server",
  "Other",
];

// Every "scale of 1-5" field (Tv, L, Av, Vv, Residual Rating) uses the
// same 5 options — one shared array instead of repeating [1,2,3,4,5]
// five times across the file.
const SCALE_OPTIONS = [1, 2, 3, 4, 5];
const RESIDUAL_SCALE_OPTIONS = [0, 1, 2, 3, 4, 5];

// Field order here matches the exact order fields appear on screen.
interface IRegisterFormState {
  issueDomain: IssueDomain | "";
  issueDescription: string;
  threatValue: string; // Tv, stored as "1".."5" (select values are always strings)
  likelihoodRating: string; // L
  assetValue: string; // Av
  vulnerabilityValue: string; // Vv
  existingControls: string;
  issueIdentifier: string;
  towerMailId: string;
  mitigationPlan: string;
  residualIssueRating: string;
  targetDate: string; // ISO date, e.g. "2026-08-01"
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

// Only these two are optional per spec — every other field required.
const OPTIONAL_FIELDS: FieldName[] = ["existingControls", "remarks"];

function validateField(
  field: FieldName,
  value: string,
  todayIso: string,
): string {
  if (OPTIONAL_FIELDS.indexOf(field) !== -1) return "";
  if (!value.trim()) return "This field is required.";
  if (field === "towerMailId" && !EMAIL_REGEX.test(value)) {
    return "Enter a valid email address.";
  }
  if (field === "targetDate" && value < todayIso) {
    return "Target date must be today or a future date.";
  }
  return "";
}

export const RegisterIssueScreen: React.FC<IRegisterIssueScreenProps> = ({
  onBack,
  currentUserEmail,issueService,
}) => {
  const [form, setForm] = React.useState<IRegisterFormState>(() => ({
    ...EMPTY_FORM,
    towerMailId: currentUserEmail,
  }));
  const [touched, setTouched] = React.useState<
    Partial<Record<FieldName, boolean>>
  >({});

  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submittedId, setSubmittedId] = React.useState<number | null>(null);
  const todayIso = React.useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const monthValue = now.getMonth() + 1;
    const dayValue = now.getDate();
    const month = monthValue < 10 ? `0${monthValue}` : `${monthValue}`;
    const day = dayValue < 10 ? `0${dayValue}` : `${dayValue}`;
    return `${year}-${month}-${day}`;
  }, []);

   const errors: Partial<Record<FieldName, string>> = {};
  (Object.keys(form) as FieldName[]).forEach((field) => {
    if (touched[field]) {
      errors[field] = validateField(field, form[field], todayIso);
    }
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
  const handleSubmit = async (): Promise<void> => {
    markAllTouched();
    if (!isFormValid) return; // errors are now visible; stop here

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
  // Live Issue Score — recalculates on every render automatically,
  // since it just reads current form values. Returns null until all
  // four scoring fields are filled in, so we don't show "0" or "NaN"
  // for a half-finished form.
  const issueScore = React.useMemo(() => {
    const { threatValue, likelihoodRating, assetValue, vulnerabilityValue } =
      form;
    if (
      !threatValue ||
      !likelihoodRating ||
      !assetValue ||
      !vulnerabilityValue
    ) {
      return null;
    }
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

  // Small reusable renderer for the five "scale of 1-5" dropdowns —
  // avoids writing near-identical JSX five times.
  const renderScaleField = (
    field: FieldName,
    label: string,
    helpText: string,
    options: number[] = SCALE_OPTIONS, // defaults to 1-5 for Tv/L/Av/Vv
  ): React.ReactElement => (
    <div className={styles.formField}>
      <label>{label}</label>
      <select
        value={form[field]}
        onChange={(e) => updateField(field, e.target.value as never)}
        onBlur={() => markTouched(field)}
      >
        <option value="">-- Select --</option>
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <p className={styles.helpText}>{helpText}</p>
      {errors[field] && (
        <span className={styles.fieldError}>{errors[field]}</span>
      )}
    </div>
  );

  return (
  <div className={styles.screenPlaceholder}>
    <button onClick={onBack} disabled={submitting}>← Home</button>
    <h2>Register Issue</h2>

    {submittedId !== null ? (
      <div className={styles.successBox}>
        <h3>✅ Issue submitted successfully</h3>
        <p>Internal record ID: {submittedId}</p>
        <p>
          The official Issue ID (e.g. ISS-0001) will appear shortly once Power
          Automate processes it.
        </p>
        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
          <button onClick={onBack}>← Back to Home</button>
          <button onClick={resetForm}>+ Submit Another Issue</button>
        </div>
      </div>
    ) : (
      <fieldset disabled={submitting} className={styles.formFieldset}>
        {/* 1. Issue Domain */}
        <div className={styles.formField}>
          <label>Issue Domain</label>
          <select
            value={form.issueDomain}
            onChange={(e) => updateField("issueDomain", e.target.value as IssueDomain)}
            onBlur={() => markTouched("issueDomain")}
          >
            <option value="">-- Select --</option>
            {DOMAIN_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.issueDomain && <span className={styles.fieldError}>{errors.issueDomain}</span>}
        </div>

        {/* 2. Issue Description */}
        <div className={styles.formField}>
          <label>Issue Description</label>
          <textarea
            value={form.issueDescription}
            onChange={(e) => updateField("issueDescription", e.target.value)}
            onBlur={() => markTouched("issueDescription")}
          />
          {errors.issueDescription && <span className={styles.fieldError}>{errors.issueDescription}</span>}
        </div>

        {/* 3-6. Scoring fields */}
        {renderScaleField("threatValue", "Threat Value (Tv)", "1 = very low impact, 5 = very high impact")}
        {renderScaleField("likelihoodRating", "Likelihood Rating (L)", "1 = rare, 5 = almost certain to occur")}
        {renderScaleField("assetValue", "Asset Value (Av)", "1 = very low value, 5 = very high value")}
        {renderScaleField("vulnerabilityValue", "Vulnerability Value (Vv)", "1 = very low, 5 = very high")}

        {/* 7. Issue Score */}
        <div className={styles.formField}>
          <label>Issue Score</label>
          <div>
            {issueScore === null ? "Complete Tv, L, Av, Vv above to calculate" : issueScore}
          </div>
        </div>

        {/* 8. Existing Controls — optional */}
        <div className={styles.formField}>
          <label>Existing Controls (optional)</label>
          <textarea
            value={form.existingControls}
            onChange={(e) => updateField("existingControls", e.target.value)}
            onBlur={() => markTouched("existingControls")}
          />
        </div>

        {/* 9. Issue Identifier */}
        <div className={styles.formField}>
          <label>Issue Identifier</label>
          <input
            type="text"
            value={form.issueIdentifier}
            onChange={(e) => updateField("issueIdentifier", e.target.value)}
            onBlur={() => markTouched("issueIdentifier")}
          />
          {errors.issueIdentifier && <span className={styles.fieldError}>{errors.issueIdentifier}</span>}
        </div>

        {/* 10. Tower Mail ID */}
        <div className={styles.formField}>
          <label>Tower Mail ID</label>
          <input type="email" value={form.towerMailId} readOnly disabled />
        </div>

        {/* 11. Mitigation Plan */}
        <div className={styles.formField}>
          <label>Mitigation Plan</label>
          <textarea
            value={form.mitigationPlan}
            onChange={(e) => updateField("mitigationPlan", e.target.value)}
            onBlur={() => markTouched("mitigationPlan")}
          />
          {errors.mitigationPlan && <span className={styles.fieldError}>{errors.mitigationPlan}</span>}
        </div>

        {/* 12. Residual Issue Rating */}
        {renderScaleField(
          "residualIssueRating",
          "Residual Issue Rating",
          "Risk remaining after controls/mitigation are applied. 0 = none, 5 = very high",
          RESIDUAL_SCALE_OPTIONS,
        )}

        {/* 13. Target Date */}
        <div className={styles.formField}>
          <label>Target Date</label>
          <input
            type="date"
            value={form.targetDate}
            min={todayIso}
            onChange={(e) => updateField("targetDate", e.target.value)}
            onBlur={() => markTouched("targetDate")}
          />
          {errors.targetDate && <span className={styles.fieldError}>{errors.targetDate}</span>}
        </div>

        {/* 14. Remarks — optional */}
        <div className={styles.formField}>
          <label>Remarks (optional)</label>
          <textarea
            value={form.remarks}
            onChange={(e) => updateField("remarks", e.target.value)}
            onBlur={() => markTouched("remarks")}
          />
        </div>

        {submitError && <p className={styles.fieldError}>{submitError}</p>}
        <button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Issue"}
        </button>
      </fieldset>
    )}
  </div>
);
};
