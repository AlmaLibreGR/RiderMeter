"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { getDurationHoursFromTimes, formatDurationLabel } from "@/lib/dates";
import { formatCurrency } from "@/lib/formatters";
import { supportedPlatforms } from "@/types/domain";

type ShiftEntryFormProps = {
  initialDate: string;
  currency: "EUR";
};

type FormState = {
  date: string;
  startTime: string;
  endTime: string;
  platform: string;
  area: string;
  manualHoursWorked: string;
  ordersCompleted: string;
  kilometersDriven: string;
  baseEarnings: string;
  tipsAmount: string;
  bonusAmount: string;
  fuelExpenseDirect: string;
  tollsOrParking: string;
  notes: string;
};

const numericFields: Array<keyof FormState> = [
  "ordersCompleted",
  "kilometersDriven",
  "baseEarnings",
  "tipsAmount",
  "bonusAmount",
  "fuelExpenseDirect",
  "tollsOrParking",
];

function toNumber(value: string) {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export default function ShiftEntryForm({ initialDate, currency }: ShiftEntryFormProps) {
  const t = useTranslations();
  const locale = useLocale() as "en" | "el";
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [durationMode, setDurationMode] = useState<"auto" | "manual">("auto");
  const [form, setForm] = useState<FormState>({
    date: initialDate,
    startTime: "",
    endTime: "",
    platform: "efood",
    area: "",
    manualHoursWorked: "",
    ordersCompleted: "",
    kilometersDriven: "",
    baseEarnings: "",
    tipsAmount: "",
    bonusAmount: "",
    fuelExpenseDirect: "",
    tollsOrParking: "",
    notes: "",
  });

  const derivedHoursWorked = useMemo(
    () => getDurationHoursFromTimes(form.startTime, form.endTime),
    [form.startTime, form.endTime]
  );
  const resolvedHoursWorked =
    durationMode === "auto" && derivedHoursWorked
      ? derivedHoursWorked
      : toNumber(form.manualHoursWorked);

  const grossRevenue = useMemo(
    () =>
      toNumber(form.baseEarnings) + toNumber(form.tipsAmount) + toNumber(form.bonusAmount),
    [form.baseEarnings, form.tipsAmount, form.bonusAmount]
  );
  const grossPerHour = useMemo(() => {
    return Number.isFinite(resolvedHoursWorked) && resolvedHoursWorked > 0
      ? grossRevenue / resolvedHoursWorked
      : 0;
  }, [grossRevenue, resolvedHoursWorked]);

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!form.date) {
      nextErrors.date = t("shiftForm.errors.date");
    }

    if (!form.area.trim()) {
      nextErrors.area = t("shiftForm.errors.area");
    }

    if ((form.startTime && !form.endTime) || (!form.startTime && form.endTime)) {
      nextErrors.endTime = t("shiftForm.errors.invalid");
    }

    if (durationMode === "auto") {
      if (!form.startTime || !form.endTime || !derivedHoursWorked || derivedHoursWorked <= 0) {
        nextErrors.endTime = t("shiftForm.errors.invalid");
      }
    } else {
      const manualHoursWorked = toNumber(form.manualHoursWorked);
      if (!Number.isFinite(manualHoursWorked) || manualHoursWorked <= 0) {
        nextErrors.manualHoursWorked = t("shiftForm.errors.hoursWorked");
      }
    }

    numericFields.forEach((field) => {
      const value = toNumber(form[field]);
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
        ...form,
        hoursWorked: resolvedHoursWorked,
        platform: supportedPlatforms.includes(form.platform as (typeof supportedPlatforms)[number])
          ? form.platform
          : "other",
      }),
    });

    const payload = (await response.json()) as { ok: boolean; error?: string };

    if (!response.ok || !payload.ok) {
      setFeedback(payload.error ?? t("shiftForm.errors.generic"));
      setLoading(false);
      return;
    }

    setForm((current) => ({
      ...current,
      area: "",
      manualHoursWorked: "",
      ordersCompleted: "",
      kilometersDriven: "",
      baseEarnings: "",
      tipsAmount: "",
      bonusAmount: "",
      fuelExpenseDirect: "",
      tollsOrParking: "",
      notes: "",
      startTime: "",
      endTime: "",
    }));
    setErrors({});
    setFeedback(t("shiftForm.success"));
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
      <div className="space-y-6">
        <FormGroup
          eyebrow={t("shiftForm.groups.schedule")}
          title={t("shiftForm.title")}
          description={t("shiftForm.body")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("shiftForm.fields.date")} error={errors.date}>
              <input
                type="date"
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                className={inputClass(Boolean(errors.date))}
              />
            </Field>
            <Field label={t("shiftForm.fields.platform")}>
              <select
                value={form.platform}
                onChange={(event) => updateField("platform", event.target.value)}
                className={inputClass(false)}
              >
                <option value="efood">efood</option>
                <option value="wolt">Wolt</option>
                <option value="freelance">Freelance</option>
                <option value="other">{t("table.other")}</option>
              </select>
            </Field>
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

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Field label={t("shiftForm.fields.area")} helper={t("shiftForm.help.area")} error={errors.area}>
              <input
                type="text"
                value={form.area}
                onChange={(event) => updateField("area", event.target.value)}
                className={inputClass(Boolean(errors.area))}
              />
            </Field>

            <DurationCard
              title={t("shiftForm.duration.title")}
              mode={durationMode}
              onModeChange={setDurationMode}
              derivedLabel={
                derivedHoursWorked
                  ? formatDurationLabel(derivedHoursWorked, locale)
                  : t("shiftForm.duration.awaiting")
              }
              manualValue={form.manualHoursWorked}
              onManualChange={(value) => updateField("manualHoursWorked", value)}
              error={errors.manualHoursWorked}
              t={t}
            />
          </div>
        </FormGroup>

        <FormGroup
          eyebrow={t("shiftForm.groups.performance")}
          title={t("dashboard.sections.operations")}
          description={t("dashboard.body")}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            <PreviewStat
              label={t("shiftForm.fields.hoursWorked")}
              value={
                Number.isFinite(resolvedHoursWorked) && resolvedHoursWorked > 0
                  ? `${resolvedHoursWorked.toFixed(2)} h`
                  : t("shiftForm.duration.awaiting")
              }
            />
          </div>
        </FormGroup>

        <FormGroup
          eyebrow={t("shiftForm.groups.earnings")}
          title={t("dashboard.hero.revenue")}
          description={t("dashboard.charts.revenueCompositionBody")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <NumberField label={t("shiftForm.fields.baseEarnings")} value={form.baseEarnings} error={errors.baseEarnings} onChange={(value) => updateField("baseEarnings", value)} />
            <NumberField label={t("shiftForm.fields.tipsAmount")} value={form.tipsAmount} error={errors.tipsAmount} onChange={(value) => updateField("tipsAmount", value)} />
            <NumberField label={t("shiftForm.fields.bonusAmount")} value={form.bonusAmount} error={errors.bonusAmount} onChange={(value) => updateField("bonusAmount", value)} />
            <NumberField label={t("shiftForm.fields.fuelExpenseDirect")} value={form.fuelExpenseDirect} error={errors.fuelExpenseDirect} helper={t("shiftForm.help.fuelExpenseDirect")} onChange={(value) => updateField("fuelExpenseDirect", value)} />
          </div>
        </FormGroup>

        <FormGroup
          eyebrow={t("shiftForm.groups.extras")}
          title={t("shiftForm.fields.notes")}
          description={t("shiftForm.help.notes")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <NumberField label={t("shiftForm.fields.tollsOrParking")} value={form.tollsOrParking} error={errors.tollsOrParking} onChange={(value) => updateField("tollsOrParking", value)} />
            <Field label={t("shiftForm.fields.notes")}>
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                className={`${inputClass(false)} min-h-[120px]`}
              />
            </Field>
          </div>
        </FormGroup>
      </div>

      <aside className="space-y-6">
        <section className="rm-surface-strong p-5">
          <div className="rm-pill">{t("shiftForm.groups.preview")}</div>
          <div className="mt-4 space-y-4">
            <PreviewStat label={t("shiftForm.preview.grossRevenue")} value={formatCurrency(grossRevenue, locale, currency)} />
            <PreviewStat label={t("shiftForm.preview.grossPerHour")} value={formatCurrency(grossPerHour, locale, currency)} />
          </div>

          {feedback ? (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {feedback}
            </div>
          ) : null}

          <button type="submit" disabled={loading} className="rm-button-primary mt-5 w-full disabled:opacity-60">
            {loading ? t("common.saving") : t("shiftForm.submit")}
          </button>

          <div className="mt-4 grid gap-3">
            <Link href="/" className="rm-button-secondary">
              {t("common.backToDashboard")}
            </Link>
            <Link href="/history" className="rm-button-secondary">
              {t("common.viewHistory")}
            </Link>
          </div>
        </section>
      </aside>
    </form>
  );
}

function FormGroup({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rm-surface-strong p-5 md:p-6">
      <div className="rm-pill">{eyebrow}</div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
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
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      <p className={`mt-2 text-sm ${error ? "text-rose-600" : "text-slate-500"}`}>{error || helper || " "}</p>
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
      <input type="number" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} className={inputClass(Boolean(error))} />
    </Field>
  );
}

function DurationCard({
  title,
  mode,
  onModeChange,
  derivedLabel,
  manualValue,
  onManualChange,
  error,
  t,
}: {
  title: string;
  mode: "auto" | "manual";
  onModeChange: (mode: "auto" | "manual") => void;
  derivedLabel: string;
  manualValue: string;
  onManualChange: (value: string) => void;
  error?: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
          <button type="button" onClick={() => onModeChange("auto")} className={`rounded-full px-3 py-1 text-xs font-semibold ${mode === "auto" ? "bg-slate-950 text-white" : "text-slate-500"}`}>
            {t("shiftForm.duration.auto")}
          </button>
          <button type="button" onClick={() => onModeChange("manual")} className={`rounded-full px-3 py-1 text-xs font-semibold ${mode === "manual" ? "bg-slate-950 text-white" : "text-slate-500"}`}>
            {t("shiftForm.duration.manual")}
          </button>
        </div>
      </div>
      {mode === "auto" ? (
        <p className="mt-4 text-2xl font-semibold text-slate-950">{derivedLabel}</p>
      ) : (
        <div className="mt-4">
          <input type="number" step="0.01" value={manualValue} onChange={(event) => onManualChange(event.target.value)} className={inputClass(Boolean(error))} />
          <p className={`mt-2 text-sm ${error ? "text-rose-600" : "text-slate-500"}`}>{error || t("shiftForm.duration.manualHelp")}</p>
        </div>
      )}
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-base text-slate-900 outline-none transition ${
    hasError
      ? "border-rose-300 bg-rose-50/40"
      : "border-slate-300 bg-white hover:border-slate-400 focus:border-slate-400"
  }`;
}
