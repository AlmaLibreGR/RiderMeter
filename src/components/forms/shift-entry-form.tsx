"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  CloudRain,
  Coins,
  Copy,
  NotebookPen,
  Route,
  Save,
  SunMedium,
  Timer,
  Wind,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { formatDurationLabel, getDurationHoursFromTimes } from "@/lib/dates";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import {
  supportedPlatforms,
  supportedWeatherConditions,
  type ShiftDraft,
} from "@/types/domain";

type ShiftEntryFormProps = {
  initialDate: string;
  currency: "EUR";
  timezone: string;
  initialDraft: ShiftDraft | null;
};

type FormState = {
  date: string;
  startTime: string;
  endTime: string;
  manualHoursWorked: string;
  ordersCompleted: string;
  kilometersDriven: string;
  baseEarnings: string;
  tipsAmount: string;
  bonusAmount: string;
  fuelExpenseDirect: string;
  tollsOrParking: string;
  platform: string;
  weatherCondition: string;
  notes: string;
};

type FormMode = "quick" | "timer";

const draftStorageKey = "ridermeter.shiftDraft";

function toNumber(value: string) {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function serializeDraft(form: FormState, mode: FormMode, resolvedHoursWorked: number | null): ShiftDraft {
  return {
    mode,
    date: form.date,
    startTime: form.startTime || null,
    endTime: form.endTime || null,
    hoursWorked: resolvedHoursWorked,
    ordersCompleted: safeNumber(form.ordersCompleted),
    kilometersDriven: safeNumber(form.kilometersDriven),
    baseEarnings: safeNumber(form.baseEarnings),
    tipsAmount: safeNumber(form.tipsAmount),
    bonusAmount: safeNumber(form.bonusAmount),
    fuelExpenseDirect: form.fuelExpenseDirect ? safeNumber(form.fuelExpenseDirect) : null,
    tollsOrParking: safeNumber(form.tollsOrParking),
    platform: isSupportedPlatform(form.platform) ? form.platform : "other",
    weatherCondition: isSupportedWeather(form.weatherCondition) ? form.weatherCondition : "unknown",
    notes: form.notes.trim() || null,
  };
}

function draftToFormState(initialDate: string, draft: ShiftDraft | null): FormState {
  return {
    date: draft?.date ?? initialDate,
    startTime: draft?.startTime ?? "",
    endTime: draft?.endTime ?? "",
    manualHoursWorked: draft?.hoursWorked ? String(draft.hoursWorked) : "",
    ordersCompleted: draft?.ordersCompleted ? String(draft.ordersCompleted) : "",
    kilometersDriven: draft?.kilometersDriven ? String(draft.kilometersDriven) : "",
    baseEarnings: draft?.baseEarnings ? String(draft.baseEarnings) : "",
    tipsAmount: draft?.tipsAmount ? String(draft.tipsAmount) : "",
    bonusAmount: draft?.bonusAmount ? String(draft.bonusAmount) : "",
    fuelExpenseDirect:
      draft?.fuelExpenseDirect == null || draft.fuelExpenseDirect === 0
        ? ""
        : String(draft.fuelExpenseDirect),
    tollsOrParking: draft?.tollsOrParking ? String(draft.tollsOrParking) : "",
    platform: draft?.platform ?? "efood",
    weatherCondition: draft?.weatherCondition ?? "unknown",
    notes: draft?.notes ?? "",
  };
}

function createEmptyFormState(initialDate: string): FormState {
  return draftToFormState(initialDate, null);
}

export default function ShiftEntryForm({
  initialDate,
  currency,
  timezone,
  initialDraft,
}: ShiftEntryFormProps) {
  const t = useTranslations();
  const locale = useLocale() as "en" | "el";
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<FormMode>(initialDraft?.mode ?? "quick");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<FormState>(() => createEmptyFormState(initialDate));
  const [savedLocalDraft, setSavedLocalDraft] = useState<ShiftDraft | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      return raw ? (JSON.parse(raw) as ShiftDraft) : null;
    } catch {
      return null;
    }
  });

  const derivedHoursWorked = useMemo(
    () => getDurationHoursFromTimes(form.startTime, form.endTime),
    [form.startTime, form.endTime]
  );
  const resolvedHoursWorked =
    mode === "timer"
      ? derivedHoursWorked
      : Number.isFinite(toNumber(form.manualHoursWorked))
        ? toNumber(form.manualHoursWorked)
        : null;

  const grossRevenue = useMemo(
    () =>
      safeNumber(form.baseEarnings) + safeNumber(form.tipsAmount) + safeNumber(form.bonusAmount),
    [form.baseEarnings, form.tipsAmount, form.bonusAmount]
  );

  const grossPerHour = useMemo(() => {
    return resolvedHoursWorked && resolvedHoursWorked > 0 ? grossRevenue / resolvedHoursWorked : 0;
  }, [grossRevenue, resolvedHoursWorked]);

  const quickChecklist = [
    {
      label: t("shiftForm.preview.validationHours"),
      valid: Boolean(resolvedHoursWorked && resolvedHoursWorked > 0),
    },
    {
      label: t("shiftForm.preview.validationNumbers"),
      valid: [
        form.ordersCompleted,
        form.kilometersDriven,
        form.baseEarnings,
        form.tipsAmount,
        form.bonusAmount,
        form.fuelExpenseDirect,
        form.tollsOrParking,
      ].every((value) => {
        const numeric = toNumber(value || "0");
        return Number.isFinite(numeric) && numeric >= 0;
      }),
    },
  ];

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function hydrateFromDraft(draft: ShiftDraft | null) {
    if (!draft) {
      return;
    }

    setMode(draft.mode);
    setForm(draftToFormState(initialDate, draft));
    setFeedback(null);
    setErrors({});
  }

  function clearLocalDraft() {
    window.localStorage.removeItem(draftStorageKey);
    setSavedLocalDraft(null);
    setFeedback(t("shiftForm.draftCleared"));
  }

  function saveLocalDraft() {
    const draft = serializeDraft(form, mode, resolvedHoursWorked ?? null);
    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    setSavedLocalDraft(draft);
    setFeedback(t("shiftForm.draftSaved"));
  }

  function resetForm() {
    setForm(createEmptyFormState(initialDate));
    setMode("quick");
    setShowAdvanced(false);
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!form.date) {
      nextErrors.date = t("shiftForm.errors.date");
    }

    if (mode === "timer") {
      if (!form.startTime || !form.endTime || !derivedHoursWorked || derivedHoursWorked <= 0) {
        nextErrors.endTime = t("shiftForm.errors.invalid");
      }
    } else {
      const manualHours = toNumber(form.manualHoursWorked);
      if (!Number.isFinite(manualHours) || manualHours <= 0) {
        nextErrors.manualHoursWorked = t("shiftForm.errors.hoursWorked");
      }
    }

    [
      "ordersCompleted",
      "kilometersDriven",
      "baseEarnings",
      "tipsAmount",
      "bonusAmount",
      "fuelExpenseDirect",
      "tollsOrParking",
    ].forEach((field) => {
      const value = toNumber(form[field as keyof FormState] || "0");
      if (!Number.isFinite(value) || value < 0) {
        nextErrors[field] = t("shiftForm.errors.nonNegative");
      }
    });

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFeedback(t("shiftForm.errors.invalid"));
      return;
    }

    setLoading(true);

    const response = await fetch("/api/shifts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: form.date,
        startTime: mode === "timer" ? form.startTime : null,
        endTime: mode === "timer" ? form.endTime : null,
        hoursWorked: mode === "quick" ? resolvedHoursWorked : undefined,
        ordersCompleted: safeNumber(form.ordersCompleted),
        kilometersDriven: safeNumber(form.kilometersDriven),
        baseEarnings: safeNumber(form.baseEarnings),
        tipsAmount: safeNumber(form.tipsAmount),
        bonusAmount: safeNumber(form.bonusAmount),
        fuelExpenseDirect: form.fuelExpenseDirect ? safeNumber(form.fuelExpenseDirect) : null,
        tollsOrParking: safeNumber(form.tollsOrParking),
        platform: isSupportedPlatform(form.platform) ? form.platform : "other",
        weatherCondition: isSupportedWeather(form.weatherCondition)
          ? form.weatherCondition
          : "unknown",
        notes: form.notes.trim() || null,
      }),
    });

    const payload = (await response.json()) as { ok: boolean; error?: string };
    setLoading(false);

    if (!response.ok || !payload.ok) {
      setFeedback(payload.error ?? t("shiftForm.errors.generic"));
      return;
    }

    window.localStorage.removeItem(draftStorageKey);
    setSavedLocalDraft(null);
    setErrors({});
    setFeedback(t("shiftForm.success"));
    resetForm();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 pb-28 lg:grid-cols-[minmax(0,1fr)_20rem] lg:pb-0 xl:grid-cols-[minmax(0,1.3fr)_22rem]"
    >
      <div className="space-y-4">
        <section className="rm-surface p-4 md:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <div className="rm-pill">{t("shiftForm.eyebrow")}</div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {t("shiftForm.title")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t("shiftForm.body")}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => hydrateFromDraft(initialDraft)}
                  className="rm-button-secondary"
                >
                  <Copy size={15} />
                  {t("shiftForm.useLastShift")}
                </button>
                {savedLocalDraft ? (
                  <button
                    type="button"
                    onClick={() => hydrateFromDraft(savedLocalDraft)}
                    className="rm-button-secondary"
                  >
                    <Save size={15} />
                    {t("shiftForm.restoreDraft")}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rm-segmented-control">
              <button
                type="button"
                onClick={() => setMode("quick")}
                className={`rm-segmented-button ${mode === "quick" ? "rm-segmented-button-active" : ""}`}
              >
                <NotebookPen size={16} />
                {t("shiftForm.modes.quick")}
              </button>
              <button
                type="button"
                onClick={() => setMode("timer")}
                className={`rm-segmented-button ${mode === "timer" ? "rm-segmented-button-active" : ""}`}
              >
                <Timer size={16} />
                {t("shiftForm.modes.timer")}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryPair
                label={t("shiftForm.fields.date")}
                value={form.date ? formatDate(form.date, locale, timezone) : "-"}
              />
              <SummaryPair
                label={t("shiftForm.fields.weatherCondition")}
                value={t(`shiftForm.weather.${form.weatherCondition}`)}
              />
              <SummaryPair
                label={t("shiftForm.duration.title")}
                value={
                  resolvedHoursWorked && resolvedHoursWorked > 0
                    ? formatDurationLabel(resolvedHoursWorked, locale)
                    : t("shiftForm.duration.awaiting")
                }
              />
              <SummaryPair
                label={t("shiftForm.preview.grossRevenue")}
                value={formatCurrency(grossRevenue, locale, currency)}
              />
            </div>
          </div>
        </section>

        <section className="rm-surface-strong p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] bg-orange-50 text-orange-600">
              <CalendarDays size={18} />
            </div>
            <div>
              <div className="rm-pill">{t("shiftForm.groups.schedule")}</div>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">
                {mode === "quick" ? t("shiftForm.quickTitle") : t("shiftForm.timerTitle")}
              </h3>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label={t("shiftForm.fields.date")} error={errors.date}>
              <input
                type="date"
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                className={inputClass(Boolean(errors.date))}
              />
            </Field>

            <div>
              <label className="rm-field-label">{t("shiftForm.fields.platform")}</label>
              <div className="rm-inline-chip-row">
                {[
                  { value: "efood", label: "efood" },
                  { value: "wolt", label: "Wolt" },
                  { value: "freelance", label: "Freelance" },
                  { value: "other", label: t("table.other") },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField("platform", option.value)}
                    className={`rm-inline-chip ${form.platform === option.value ? "rm-inline-chip-active" : ""}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="rm-field-label">{t("shiftForm.fields.weatherCondition")}</label>
            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
              {supportedWeatherConditions
                .filter((value) => value !== "unknown")
                .map((condition) => (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => updateField("weatherCondition", condition)}
                    className={`rm-subtle-card flex items-center gap-2 px-4 py-3 text-sm font-medium ${
                      form.weatherCondition === condition ? "border-orange-300 bg-orange-50" : ""
                    }`}
                  >
                    <WeatherIcon condition={condition} />
                    {t(`shiftForm.weather.${condition}`)}
                  </button>
                ))}
            </div>
          </div>

          {mode === "timer" ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label={t("shiftForm.fields.startTime")}>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) => updateField("startTime", event.target.value)}
                  className={inputClass(false)}
                />
              </Field>
              <Field label={t("shiftForm.fields.endTime")} error={errors.endTime}>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) => updateField("endTime", event.target.value)}
                  className={inputClass(Boolean(errors.endTime))}
                />
              </Field>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
              <Field
                label={t("shiftForm.fields.hoursWorked")}
                helper={t("shiftForm.duration.manualHelp")}
                error={errors.manualHoursWorked}
              >
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={form.manualHoursWorked}
                  onChange={(event) => updateField("manualHoursWorked", event.target.value)}
                  className={inputClass(Boolean(errors.manualHoursWorked))}
                />
              </Field>
              <DurationPreview
                title={t("shiftForm.duration.title")}
                value={
                  resolvedHoursWorked && resolvedHoursWorked > 0
                    ? formatDurationLabel(resolvedHoursWorked, locale)
                    : t("shiftForm.duration.awaiting")
                }
                helper={t("shiftForm.quickHelp")}
              />
            </div>
          )}
        </section>

        <section className="rm-surface-strong p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] bg-orange-50 text-orange-600">
              <Route size={18} />
            </div>
            <div>
              <div className="rm-pill">{t("shiftForm.groups.performance")}</div>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{t("shiftForm.performanceTitle")}</h3>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <NumberField
              label={t("shiftForm.fields.ordersCompleted")}
              value={form.ordersCompleted}
              error={errors.ordersCompleted}
              onChange={(value) => updateField("ordersCompleted", value)}
            />
            <NumberField
              label={t("shiftForm.fields.kilometersDriven")}
              value={form.kilometersDriven}
              error={errors.kilometersDriven}
              onChange={(value) => updateField("kilometersDriven", value)}
            />
          </div>
        </section>

        <section className="rm-surface-strong p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] bg-orange-50 text-orange-600">
              <Coins size={18} />
            </div>
            <div>
              <div className="rm-pill">{t("shiftForm.groups.earnings")}</div>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{t("shiftForm.earningsTitle")}</h3>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <NumberField
              label={t("shiftForm.fields.baseEarnings")}
              value={form.baseEarnings}
              error={errors.baseEarnings}
              onChange={(value) => updateField("baseEarnings", value)}
            />
            <NumberField
              label={t("shiftForm.fields.tipsAmount")}
              value={form.tipsAmount}
              error={errors.tipsAmount}
              onChange={(value) => updateField("tipsAmount", value)}
            />
            <NumberField
              label={t("shiftForm.fields.bonusAmount")}
              value={form.bonusAmount}
              error={errors.bonusAmount}
              onChange={(value) => updateField("bonusAmount", value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-orange-700"
          >
            {t("shiftForm.toggleAdvanced")}
            <ChevronRight size={14} className={showAdvanced ? "rotate-90 transition" : "transition"} />
          </button>

          {showAdvanced ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <NumberField
                label={t("shiftForm.fields.fuelExpenseDirect")}
                value={form.fuelExpenseDirect}
                error={errors.fuelExpenseDirect}
                helper={t("shiftForm.help.fuelExpenseDirect")}
                onChange={(value) => updateField("fuelExpenseDirect", value)}
              />
              <NumberField
                label={t("shiftForm.fields.tollsOrParking")}
                value={form.tollsOrParking}
                error={errors.tollsOrParking}
                onChange={(value) => updateField("tollsOrParking", value)}
              />
              <div className="md:col-span-2">
                <Field label={t("shiftForm.fields.notes")} helper={t("shiftForm.help.notes")}>
                  <textarea
                    value={form.notes}
                    onChange={(event) => updateField("notes", event.target.value)}
                    className={`${inputClass(false)} min-h-[124px] resize-none`}
                  />
                </Field>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <aside className="hidden space-y-4 lg:block lg:sticky lg:top-5 lg:self-start">
        <section className="rm-surface-strong p-5">
          <div className="flex items-center gap-2">
            <Clock3 size={16} className="text-orange-600" />
            <p className="rm-pill">{t("shiftForm.groups.preview")}</p>
          </div>

          <div className="mt-4 grid gap-3">
            <SummaryPair
              label={t("shiftForm.fields.date")}
              value={form.date ? formatDate(form.date, locale, timezone) : "-"}
            />
            <SummaryPair
              label={t("shiftForm.fields.platform")}
              value={form.platform === "other" ? t("table.other") : form.platform}
            />
            <SummaryPair
              label={t("shiftForm.fields.weatherCondition")}
              value={t(`shiftForm.weather.${form.weatherCondition}`)}
            />
            <SummaryPair
              label={t("shiftForm.duration.title")}
              value={
                resolvedHoursWorked && resolvedHoursWorked > 0
                  ? formatDurationLabel(resolvedHoursWorked, locale)
                  : t("shiftForm.duration.awaiting")
              }
            />
          </div>

          <div className="rm-section-divider mt-5" />

          <div className="mt-5 space-y-3">
            <PreviewStat
              label={t("shiftForm.preview.grossRevenue")}
              value={formatCurrency(grossRevenue, locale, currency)}
            />
            <PreviewStat
              label={t("shiftForm.preview.grossPerHour")}
              value={formatCurrency(grossPerHour, locale, currency)}
            />
            <PreviewStat
              label={t("shiftForm.fields.ordersCompleted")}
              value={formatNumber(safeNumber(form.ordersCompleted), locale, 0)}
            />
            <PreviewStat
              label={t("shiftForm.fields.kilometersDriven")}
              value={formatNumber(safeNumber(form.kilometersDriven), locale)}
            />
          </div>

          <div className="mt-5 rounded-[24px] border border-stone-200 bg-white px-4 py-4">
            <p className="rm-stat-kicker">{t("shiftForm.preview.validationTitle")}</p>
            <div className="mt-3 space-y-2">
              {quickChecklist.map((item) => (
                <ChecklistItem key={item.label} label={item.label} valid={item.valid} />
              ))}
            </div>
          </div>

          {feedback ? (
            <InlineNotice error={Object.keys(errors).length > 0}>{feedback}</InlineNotice>
          ) : null}

          <div className="mt-5 space-y-3">
            <button type="submit" disabled={loading} className="rm-button-primary w-full disabled:opacity-60">
              {loading ? t("common.saving") : t("shiftForm.submit")}
            </button>
            <button type="button" onClick={saveLocalDraft} className="rm-button-secondary w-full">
              <Save size={15} />
              {t("shiftForm.saveDraft")}
            </button>
            {savedLocalDraft ? (
              <button type="button" onClick={clearLocalDraft} className="rm-button-secondary w-full">
                {t("shiftForm.clearDraft")}
              </button>
            ) : null}
            <Link href="/" className="rm-button-secondary">
              {t("common.backToDashboard")}
            </Link>
          </div>
        </section>
      </aside>

      <div className="rm-mobile-dock lg:hidden">
        <div className="rm-mobile-dock-card">
          <div className="min-w-0 flex-1">
            <p className="rm-stat-kicker">{t("shiftForm.preview.grossRevenue")}</p>
            <p className="truncate text-base font-semibold text-slate-950">
              {formatCurrency(grossRevenue, locale, currency)}
            </p>
          </div>

          <button type="button" onClick={saveLocalDraft} className="rm-button-secondary shrink-0 px-4">
            <Save size={15} />
          </button>

          <button type="submit" disabled={loading} className="rm-button-primary shrink-0 px-5 disabled:opacity-60">
            {loading ? t("common.saving") : t("shiftForm.submit")}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  helper,
  error,
  children,
}: {
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="rm-field-label">{label}</label>
      {children}
      <p className={`rm-field-helper ${error ? "text-rose-600" : "text-slate-500"}`}>
        {error || helper || " "}
      </p>
    </div>
  );
}

function NumberField({
  label,
  value,
  error,
  helper,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  helper?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} error={error} helper={helper}>
      <input
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(Boolean(error))}
      />
    </Field>
  );
}

function DurationPreview({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <div className="rm-subtle-card p-4">
      <p className="rm-field-label">{title}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rm-stat-tile">
      <p className="rm-stat-kicker">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function SummaryPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rm-summary-pair">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-right text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ChecklistItem({ label, valid }: { label: string; valid: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
          valid ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-400"
        }`}
      >
        <span className="text-[11px] font-semibold">{valid ? "OK" : "…"}</span>
      </div>
      <p className={valid ? "text-sm text-slate-700" : "text-sm text-slate-500"}>{label}</p>
    </div>
  );
}

function InlineNotice({
  error,
  children,
}: {
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mt-4 rounded-[24px] border px-4 py-3 text-sm ${
        error
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {children}
    </div>
  );
}

function WeatherIcon({ condition }: { condition: string }) {
  if (condition === "sunny" || condition === "heatwave") {
    return <SunMedium size={15} className="text-orange-600" />;
  }

  if (condition === "rain" || condition === "cloudy") {
    return <CloudRain size={15} className="text-sky-600" />;
  }

  return <Wind size={15} className="text-slate-500" />;
}

function inputClass(hasError: boolean) {
  return `rm-input ${hasError ? "border-rose-300 bg-rose-50/80" : ""}`;
}

function isSupportedPlatform(value: string): value is (typeof supportedPlatforms)[number] {
  return supportedPlatforms.includes(value as (typeof supportedPlatforms)[number]);
}

function isSupportedWeather(value: string): value is (typeof supportedWeatherConditions)[number] {
  return supportedWeatherConditions.includes(value as (typeof supportedWeatherConditions)[number]);
}

function safeNumber(value: string) {
  const parsed = toNumber(value || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}
