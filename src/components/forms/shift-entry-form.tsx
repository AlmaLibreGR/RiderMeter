"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  CloudRain,
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
type QuickAction = {
  label: string;
  amount: number;
  mode?: "delta" | "set";
};
type ShortcutAction =
  | { id: "platform"; label: string; valueLabel: string }
  | { id: "weather"; label: string; valueLabel: string }
  | { id: "payout"; label: string; valueLabel: string }
  | { id: "activity"; label: string; valueLabel: string };

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

  const quickHoursActions: QuickAction[] = [
    { label: "4h", amount: 4, mode: "set" },
    { label: "6h", amount: 6, mode: "set" },
    { label: "8h", amount: 8, mode: "set" },
    { label: "10h", amount: 10, mode: "set" },
  ];
  const ordersActions: QuickAction[] = [
    { label: "+1", amount: 1 },
    { label: "+3", amount: 3 },
    { label: "+5", amount: 5 },
  ];
  const kilometersActions: QuickAction[] = [
    { label: "+5", amount: 5 },
    { label: "+10", amount: 10 },
    { label: "+20", amount: 20 },
  ];
  const revenueActions: QuickAction[] = [
    { label: "+10", amount: 10 },
    { label: "+20", amount: 20 },
    { label: "+50", amount: 50 },
  ];
  const tipsActions: QuickAction[] = [
    { label: "+2", amount: 2 },
    { label: "+5", amount: 5 },
    { label: "+10", amount: 10 },
  ];

  const entrySteps = [
    {
      index: "01",
      title: t("shiftForm.groups.schedule"),
      body: mode === "quick" ? t("shiftForm.quickTitle") : t("shiftForm.timerTitle"),
    },
    {
      index: "02",
      title: t("shiftForm.groups.performance"),
      body: t("shiftForm.performanceTitle"),
    },
    {
      index: "03",
      title: t("shiftForm.groups.earnings"),
      body: t("shiftForm.earningsTitle"),
    },
  ];
  const shortcutActions = useMemo<ShortcutAction[]>(() => {
    if (!initialDraft) {
      return [];
    }

    const items: ShortcutAction[] = [];
    items.push({
      id: "platform",
      label: t("shiftForm.shortcuts.platform"),
      valueLabel: initialDraft.platform === "other" ? t("table.other") : initialDraft.platform,
    });
    items.push({
      id: "weather",
      label: t("shiftForm.shortcuts.weather"),
      valueLabel: t(`shiftForm.weather.${initialDraft.weatherCondition}`),
    });

    const lastRevenue = initialDraft.baseEarnings + initialDraft.tipsAmount + initialDraft.bonusAmount;
    if (lastRevenue > 0) {
      items.push({
        id: "payout",
        label: t("shiftForm.shortcuts.payout"),
        valueLabel: formatCurrency(lastRevenue, locale, currency),
      });
    }

    if (initialDraft.ordersCompleted > 0 || initialDraft.kilometersDriven > 0) {
      items.push({
        id: "activity",
        label: t("shiftForm.shortcuts.activity"),
        valueLabel: `${formatNumber(initialDraft.ordersCompleted, locale, 0)} · ${formatNumber(initialDraft.kilometersDriven, locale)}`,
      });
    }

    return items;
  }, [currency, initialDraft, locale, t]);
  const justFinishedHint =
    mode === "quick" &&
    !form.manualHoursWorked &&
    !form.ordersCompleted &&
    !form.kilometersDriven &&
    !form.baseEarnings &&
    !form.tipsAmount &&
    !form.bonusAmount;
  const mobilePrimaryLabel = loading
    ? t("common.saving")
    : justFinishedHint
      ? t("shiftForm.submitFast")
      : t("shiftForm.submit");

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function applyQuickAction(field: keyof FormState, action: QuickAction) {
    const currentValue = safeNumber(form[field] ?? "");
    const nextValue = action.mode === "set" ? action.amount : Math.max(0, currentValue + action.amount);
    updateField(field, formatQuickNumber(nextValue));
  }

  function applyShortcut(action: ShortcutAction["id"]) {
    if (!initialDraft) {
      return;
    }

    if (action === "platform") {
      updateField("platform", initialDraft.platform);
      return;
    }

    if (action === "weather") {
      updateField("weatherCondition", initialDraft.weatherCondition);
      return;
    }

    if (action === "payout") {
      updateField("baseEarnings", formatQuickNumber(initialDraft.baseEarnings));
      updateField("tipsAmount", formatQuickNumber(initialDraft.tipsAmount));
      updateField("bonusAmount", formatQuickNumber(initialDraft.bonusAmount));
      return;
    }

    updateField("ordersCompleted", formatQuickNumber(initialDraft.ordersCompleted));
    updateField("kilometersDriven", formatQuickNumber(initialDraft.kilometersDriven));
  }

  function stampCurrentTime(field: "startTime" | "endTime") {
    updateField(field, getCurrentTimeValue());
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

  function hydrateLastShiftForToday() {
    if (!initialDraft) {
      return;
    }

    const nextDraft: ShiftDraft = {
      ...initialDraft,
      date: initialDate,
      startTime: null,
      endTime: null,
    };

    setMode("quick");
    setForm(draftToFormState(initialDate, nextDraft));
    setFeedback(t("shiftForm.prefilledToday"));
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
      className="grid gap-5 pb-28 lg:grid-cols-[minmax(0,1fr)_21rem] lg:pb-0 xl:grid-cols-[minmax(0,1.18fr)_23rem]"
    >
      <div className="space-y-4">
        <section className="rm-phone-stage">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <div className="rm-pill">{t("shiftForm.eyebrow")}</div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {mode === "quick" ? t("shiftForm.finishTitle") : t("shiftForm.title")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {mode === "quick" ? t("shiftForm.finishBody") : t("shiftForm.body")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {initialDraft ? (
                  <button
                    type="button"
                    onClick={hydrateLastShiftForToday}
                    className="rm-button-secondary"
                  >
                    <Clock3 size={15} />
                    {t("shiftForm.useLastSetupToday")}
                  </button>
                ) : null}
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

            <div className="rm-step-strip">
              {entrySteps.map((step, index) => (
                <div
                  key={step.index}
                  className={`rm-step-chip ${
                    (mode === "quick" && index <= 1) || (mode === "timer" && index === 0)
                      ? "rm-step-chip-active"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="rm-step-index">{step.index}</span>
                    <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-600">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="rm-phone-stage-header">
              <div className="min-w-0">
                <p className="rm-stat-kicker">{t("shiftForm.groups.schedule")}</p>
                <div className="mt-3 rm-segmented-control max-w-[18rem]">
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
              </div>

              <div className="min-w-0 text-right">
                <p className="rm-stat-kicker">{t("shiftForm.preview.grossRevenue")}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {formatCurrency(grossRevenue, locale, currency)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {resolvedHoursWorked && resolvedHoursWorked > 0
                    ? `${formatCurrency(grossPerHour, locale, currency)} / ${t("common.hour")}`
                    : t("shiftForm.duration.awaiting")}
                </p>
              </div>
            </div>

            {justFinishedHint ? (
              <div className="rounded-[24px] border border-orange-200 bg-orange-50/80 px-4 py-3">
                <p className="text-sm font-semibold text-orange-900">{t("shiftForm.readyTitle")}</p>
                <p className="mt-1 text-sm leading-6 text-orange-800">{t("shiftForm.readyBody")}</p>
              </div>
            ) : null}

            <div className="rm-phone-stage-grid">
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
                label={t("shiftForm.fields.platform")}
                value={form.platform === "other" ? t("table.other") : form.platform}
              />
            </div>

            {shortcutActions.length > 0 ? (
              <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="rm-stat-kicker">{t("shiftForm.shortcuts.title")}</p>
                    <p className="mt-1 text-sm text-slate-500">{t("shiftForm.shortcuts.body")}</p>
                  </div>
                  <Clock3 size={16} className="shrink-0 text-slate-400" />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {shortcutActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => applyShortcut(action.id)}
                      className="rm-journal-chip justify-between text-left"
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {action.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{action.valueLabel}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {mode === "quick" ? (
              <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="rm-stat-kicker">{t("shiftForm.finishStrip.title")}</p>
                    <p className="mt-1 text-sm text-slate-500">{t("shiftForm.finishStrip.body")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rm-inline-chip">{t("shiftForm.fields.hoursWorked")}</span>
                    <span className="rm-inline-chip">{t("shiftForm.fields.ordersCompleted")}</span>
                    <span className="rm-inline-chip">{t("shiftForm.fields.kilometersDriven")}</span>
                    <span className="rm-inline-chip">{t("shiftForm.fields.baseEarnings")}</span>
                    <span className="rm-inline-chip">{t("shiftForm.fields.tipsAmount")}</span>
                    <span className="rm-inline-chip">{t("shiftForm.fields.bonusAmount")}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rm-step-panel">
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
              <div className="md:col-span-2 mt-1 flex flex-wrap items-center gap-2">
                <p className="mr-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("shiftForm.shortcuts.now")}
                </p>
                <button
                  type="button"
                  onClick={() => stampCurrentTime("startTime")}
                  className="rm-inline-chip"
                >
                  {t("shiftForm.shortcuts.startNow")}
                </button>
                <button
                  type="button"
                  onClick={() => stampCurrentTime("endTime")}
                  className="rm-inline-chip"
                >
                  {t("shiftForm.shortcuts.endNow")}
                </button>
              </div>
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
              <div className="md:col-span-2">
                <QuickActionsRow
                  label={t("shiftForm.quickActions.hoursWorked")}
                  actions={quickHoursActions}
                  onAction={(action) => applyQuickAction("manualHoursWorked", action)}
                />
              </div>
              <DurationPreview
                title={t("shiftForm.duration.title")}
                value={
                  resolvedHoursWorked && resolvedHoursWorked > 0
                    ? formatDurationLabel(resolvedHoursWorked, locale)
                    : t("shiftForm.duration.awaiting")
                }
                helper={mode === "quick" ? t("shiftForm.quickHelp") : t("shiftForm.timerTitle")}
              />
            </div>
          )}
        </section>

        <section className="rm-step-panel">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] bg-orange-50 text-orange-600">
              <Route size={18} />
            </div>
            <div>
              <div className="rm-pill">{t("shiftForm.groups.performance")}</div>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">
                {mode === "quick" ? t("shiftForm.finishEssentialsTitle") : t("shiftForm.performanceTitle")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {mode === "quick" ? t("shiftForm.finishEssentialsBody") : t("shiftForm.quickActions.body")}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <NumberField
              label={t("shiftForm.fields.ordersCompleted")}
              value={form.ordersCompleted}
              error={errors.ordersCompleted}
              onChange={(value) => updateField("ordersCompleted", value)}
              quickActions={ordersActions}
              quickActionsLabel={t("shiftForm.quickActions.ordersCompleted")}
              onQuickAction={(action) => applyQuickAction("ordersCompleted", action)}
            />
            <NumberField
              label={t("shiftForm.fields.kilometersDriven")}
              value={form.kilometersDriven}
              error={errors.kilometersDriven}
              onChange={(value) => updateField("kilometersDriven", value)}
              quickActions={kilometersActions}
              quickActionsLabel={t("shiftForm.quickActions.kilometersDriven")}
              onQuickAction={(action) => applyQuickAction("kilometersDriven", action)}
            />
            <NumberField
              label={t("shiftForm.fields.baseEarnings")}
              value={form.baseEarnings}
              error={errors.baseEarnings}
              onChange={(value) => updateField("baseEarnings", value)}
              quickActions={revenueActions}
              quickActionsLabel={t("shiftForm.quickActions.baseEarnings")}
              onQuickAction={(action) => applyQuickAction("baseEarnings", action)}
            />
            <NumberField
              label={t("shiftForm.fields.tipsAmount")}
              value={form.tipsAmount}
              error={errors.tipsAmount}
              onChange={(value) => updateField("tipsAmount", value)}
              quickActions={tipsActions}
              quickActionsLabel={t("shiftForm.quickActions.tipsAmount")}
              onQuickAction={(action) => applyQuickAction("tipsAmount", action)}
            />
            <NumberField
              label={t("shiftForm.fields.bonusAmount")}
              value={form.bonusAmount}
              error={errors.bonusAmount}
              onChange={(value) => updateField("bonusAmount", value)}
              quickActions={tipsActions}
              quickActionsLabel={t("shiftForm.quickActions.bonusAmount")}
              onQuickAction={(action) => applyQuickAction("bonusAmount", action)}
            />
          </div>

          <details className="rm-disclosure mt-4" open={showAdvanced}>
            <summary onClick={(event) => {
              event.preventDefault();
              setShowAdvanced((current) => !current);
            }}>
              <div>
                <p className="text-sm font-semibold text-slate-950">{t("shiftForm.toggleAdvanced")}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {mode === "quick" ? t("shiftForm.moreDetailsBody") : t("shiftForm.help.notes")}
                </p>
              </div>
              <ChevronRight size={16} className={showAdvanced ? "rotate-90 text-slate-400 transition" : "text-slate-400 transition"} />
            </summary>
            {showAdvanced ? (
              <div className="rm-disclosure-body grid gap-4 md:grid-cols-2">
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
          </details>
        </section>
      </div>

      <aside className="hidden space-y-4 lg:block lg:sticky lg:top-5 lg:self-start">
        <section className="rm-flow-card">
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
            <p className="mt-1 truncate text-xs text-slate-500">
              {resolvedHoursWorked && resolvedHoursWorked > 0
                ? `${formatDurationLabel(resolvedHoursWorked, locale)} · ${formatCurrency(grossPerHour, locale, currency)} / ${t("common.hour")}`
                : t("shiftForm.mobileDockHint")}
            </p>
          </div>

          <button type="button" onClick={saveLocalDraft} className="rm-button-secondary shrink-0 px-4">
            <Save size={15} />
          </button>

          <button type="submit" disabled={loading} className="rm-button-primary shrink-0 px-5 disabled:opacity-60">
            {mobilePrimaryLabel}
          </button>
        </div>
        {feedback ? (
          <div className="mx-auto mt-2 max-w-6xl px-3">
            <InlineNotice error={Object.keys(errors).length > 0}>{feedback}</InlineNotice>
          </div>
        ) : null}
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
  quickActions,
  quickActionsLabel,
  onQuickAction,
}: {
  label: string;
  value: string;
  error?: string;
  helper?: string;
  onChange: (value: string) => void;
  quickActions?: QuickAction[];
  quickActionsLabel?: string;
  onQuickAction?: (action: QuickAction) => void;
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
      {quickActions && onQuickAction ? (
        <QuickActionsRow
          label={quickActionsLabel}
          actions={quickActions}
          onAction={onQuickAction}
        />
      ) : null}
    </Field>
  );
}

function QuickActionsRow({
  label,
  actions,
  onAction,
}: {
  label?: string;
  actions: QuickAction[];
  onAction: (action: QuickAction) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {label ? <p className="mr-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p> : null}
      {actions.map((action) => (
        <button
          key={`${action.label}-${action.amount}-${action.mode ?? "delta"}`}
          type="button"
          onClick={() => onAction(action)}
          className="rm-inline-chip"
        >
          {action.label}
        </button>
      ))}
    </div>
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
        <span className="text-[11px] font-semibold">{valid ? "OK" : "..."}</span>
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

function formatQuickNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function getCurrentTimeValue() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
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

