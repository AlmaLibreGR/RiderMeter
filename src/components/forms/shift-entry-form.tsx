"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coins,
  MapPin,
  NotebookPen,
  Route,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { formatDurationLabel, getDurationHoursFromTimes } from "@/lib/dates";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import { supportedPlatforms } from "@/types/domain";

type ShiftEntryFormProps = {
  initialDate: string;
  currency: "EUR";
  timezone: string;
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

type FlowSectionId = "schedule" | "performance" | "earnings" | "extras";

const numericFields: Array<keyof FormState> = [
  "ordersCompleted",
  "kilometersDriven",
  "baseEarnings",
  "tipsAmount",
  "bonusAmount",
  "fuelExpenseDirect",
  "tollsOrParking",
];

const sectionOrder: FlowSectionId[] = ["schedule", "performance", "earnings", "extras"];

function toNumber(value: string) {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export default function ShiftEntryForm({
  initialDate,
  currency,
  timezone,
}: ShiftEntryFormProps) {
  const t = useTranslations();
  const locale = useLocale() as "en" | "el";
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [durationMode, setDurationMode] = useState<"auto" | "manual">("auto");
  const [activeSection, setActiveSection] = useState<FlowSectionId>("schedule");
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
      toNumber(form.baseEarnings) +
      toNumber(form.tipsAmount) +
      toNumber(form.bonusAmount),
    [form.baseEarnings, form.tipsAmount, form.bonusAmount]
  );
  const grossPerHour = useMemo(() => {
    return Number.isFinite(resolvedHoursWorked) && resolvedHoursWorked > 0
      ? grossRevenue / resolvedHoursWorked
      : 0;
  }, [grossRevenue, resolvedHoursWorked]);

  const durationLabel =
    derivedHoursWorked && durationMode === "auto"
      ? formatDurationLabel(derivedHoursWorked, locale)
      : t("shiftForm.duration.awaiting");
  const platformLabel =
    form.platform === "other" ? t("table.other") : getPlatformLabel(form.platform);
  const sectionMeta = [
    {
      id: "schedule" as const,
      title: t("shiftForm.groups.schedule"),
      description: t("shiftForm.body"),
      icon: CalendarDays,
    },
    {
      id: "performance" as const,
      title: t("shiftForm.groups.performance"),
      description: t("dashboard.sections.operations"),
      icon: Route,
    },
    {
      id: "earnings" as const,
      title: t("shiftForm.groups.earnings"),
      description: t("dashboard.charts.revenueCompositionBody"),
      icon: Coins,
    },
    {
      id: "extras" as const,
      title: t("shiftForm.groups.extras"),
      description: t("shiftForm.help.notes"),
      icon: NotebookPen,
    },
  ];

  const checklist = [
    {
      label: t("shiftForm.preview.validationArea"),
      valid: form.area.trim().length > 0,
    },
    {
      label: t("shiftForm.preview.validationHours"),
      valid: Number.isFinite(resolvedHoursWorked) && resolvedHoursWorked > 0,
    },
    {
      label: t("shiftForm.preview.validationNumbers"),
      valid: numericFields.every((field) => {
        const value = toNumber(form[field]);
        return Number.isFinite(value) && value >= 0;
      }),
    },
  ];

  const activeIndex = sectionOrder.indexOf(activeSection);
  const isLastSection = activeIndex === sectionOrder.length - 1;

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

  function getSectionForField(field: string): FlowSectionId {
    if (
      field === "date" ||
      field === "startTime" ||
      field === "endTime" ||
      field === "area" ||
      field === "manualHoursWorked"
    ) {
      return "schedule";
    }

    if (field === "ordersCompleted" || field === "kilometersDriven") {
      return "performance";
    }

    if (
      field === "baseEarnings" ||
      field === "tipsAmount" ||
      field === "bonusAmount" ||
      field === "fuelExpenseDirect"
    ) {
      return "earnings";
    }

    return "extras";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const [firstField] = Object.keys(nextErrors);
      setActiveSection(getSectionForField(firstField));
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
    setActiveSection("schedule");
    setLoading(false);
  }

  function goToSection(direction: "next" | "previous") {
    const offset = direction === "next" ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(sectionOrder.length - 1, activeIndex + offset));
    setActiveSection(sectionOrder[nextIndex]);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 pb-28 lg:grid-cols-[minmax(0,1fr)_20rem] lg:pb-0 xl:grid-cols-[minmax(0,1.45fr)_22rem]"
    >
      <div className="space-y-4">
        <section className="rm-surface p-4 md:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="rm-pill">{t("shiftForm.eyebrow")}</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">
                  {t("shiftForm.title")}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {t("shiftForm.body")}
                </p>
              </div>
              <div className="hidden rounded-[22px] border border-orange-100 bg-white px-4 py-3 text-right sm:block">
                <p className="rm-stat-kicker">{`${activeIndex + 1}/${sectionOrder.length}`}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {sectionMeta[activeIndex]?.title}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryPair
                label={t("shiftForm.fields.date")}
                value={form.date ? formatDate(form.date, locale, timezone) : "-"}
              />
              <SummaryPair label={t("shiftForm.fields.platform")} value={platformLabel} />
              <SummaryPair label={t("shiftForm.duration.title")} value={durationLabel} />
              <SummaryPair
                label={t("shiftForm.preview.grossRevenue")}
                value={formatCurrency(grossRevenue, locale, currency)}
              />
            </div>

            <div className="rm-step-strip lg:hidden">
              {sectionMeta.map((section, index) => {
                const Icon = section.icon;
                const isActive = section.id === activeSection;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`rm-step-chip ${isActive ? "rm-step-chip-active" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rm-step-index">{index + 1}</span>
                      <Icon size={15} className={isActive ? "text-orange-600" : "text-slate-500"} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-950">{section.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{section.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {sectionMeta.map((section) => {
          const Icon = section.icon;
          const visible = activeSection === section.id;
          return (
            <FlowCard
              key={section.id}
              eyebrow={section.title}
              title={section.title}
              description={section.description}
              icon={<Icon size={18} />}
              className={visible ? "block" : "hidden lg:block"}
            >
              {section.id === "schedule" ? (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
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
                            className={`rm-inline-chip ${
                              form.platform === option.value ? "rm-inline-chip-active" : ""
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
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

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <Field
                      label={t("shiftForm.fields.area")}
                      helper={t("shiftForm.help.area")}
                      error={errors.area}
                    >
                      <div className="relative">
                        <MapPin
                          size={18}
                          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-stone-400"
                        />
                        <input
                          type="text"
                          value={form.area}
                          onChange={(event) => updateField("area", event.target.value)}
                          className={`${inputClass(Boolean(errors.area))} pl-11`}
                          placeholder={locale === "el" ? "π.χ. Κέντρο Αθήνας" : "e.g. Athens center"}
                        />
                      </div>
                    </Field>

                    <DurationCard
                      title={t("shiftForm.duration.title")}
                      mode={durationMode}
                      onModeChange={setDurationMode}
                      derivedLabel={durationLabel}
                      manualValue={form.manualHoursWorked}
                      onManualChange={(value) => updateField("manualHoursWorked", value)}
                      error={errors.manualHoursWorked}
                      startTime={form.startTime}
                      endTime={form.endTime}
                      t={t}
                    />
                  </div>
                </div>
              ) : null}

              {section.id === "performance" ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
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

                  <div className="grid gap-3 md:grid-cols-3">
                    <PreviewStat
                      label={t("shiftForm.fields.hoursWorked")}
                      value={
                        Number.isFinite(resolvedHoursWorked) && resolvedHoursWorked > 0
                          ? `${resolvedHoursWorked.toFixed(2)} h`
                          : t("shiftForm.duration.awaiting")
                      }
                    />
                    <PreviewStat
                      label={t("shiftForm.fields.ordersCompleted")}
                      value={formatNumber(toNumber(form.ordersCompleted), locale, 0)}
                    />
                    <PreviewStat
                      label={t("shiftForm.fields.kilometersDriven")}
                      value={formatNumber(toNumber(form.kilometersDriven), locale)}
                    />
                  </div>
                </div>
              ) : null}

              {section.id === "earnings" ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
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
                    <NumberField
                      label={t("shiftForm.fields.fuelExpenseDirect")}
                      value={form.fuelExpenseDirect}
                      error={errors.fuelExpenseDirect}
                      helper={t("shiftForm.help.fuelExpenseDirect")}
                      onChange={(value) => updateField("fuelExpenseDirect", value)}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <PreviewStat
                      label={t("shiftForm.preview.grossRevenue")}
                      value={formatCurrency(grossRevenue, locale, currency)}
                    />
                    <PreviewStat
                      label={t("shiftForm.preview.grossPerHour")}
                      value={formatCurrency(grossPerHour, locale, currency)}
                    />
                  </div>
                </div>
              ) : null}

              {section.id === "extras" ? (
                <div className="space-y-4">
                  <NumberField
                    label={t("shiftForm.fields.tollsOrParking")}
                    value={form.tollsOrParking}
                    error={errors.tollsOrParking}
                    onChange={(value) => updateField("tollsOrParking", value)}
                  />

                  <Field label={t("shiftForm.fields.notes")} helper={t("shiftForm.help.notes")}>
                    <textarea
                      value={form.notes}
                      onChange={(event) => updateField("notes", event.target.value)}
                      className={`${inputClass(false)} min-h-[136px] resize-none`}
                      placeholder={
                        locale === "el"
                          ? "π.χ. πολλή κίνηση, βροχή, bonus ώρας αιχμής"
                          : "e.g. heavy traffic, rain, surge bonus"
                      }
                    />
                  </Field>

                  <div className="rm-soft-note">
                    <p className="rm-stat-kicker">{t("shiftForm.preview.validationTitle")}</p>
                    <div className="mt-3 space-y-2">
                      {checklist.map((item) => (
                        <ChecklistItem key={item.label} label={item.label} valid={item.valid} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-between gap-3 lg:hidden">
                <button
                  type="button"
                  onClick={() => goToSection("previous")}
                  disabled={activeIndex === 0}
                  className="rm-button-secondary disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                  {t("common.previous")}
                </button>

                {!isLastSection ? (
                  <button
                    type="button"
                    onClick={() => goToSection("next")}
                    className="rm-button-primary"
                  >
                    {t("common.next")}
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <div className="text-right text-sm text-slate-500">
                    {t("shiftForm.submit")}
                  </div>
                )}
              </div>
            </FlowCard>
          );
        })}
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
            <SummaryPair label={t("shiftForm.fields.platform")} value={platformLabel} />
            <SummaryPair label={t("shiftForm.duration.title")} value={durationLabel} />
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
          </div>

          <div className="mt-5 rounded-[24px] border border-stone-200 bg-white px-4 py-4">
            <p className="rm-stat-kicker">{t("shiftForm.preview.validationTitle")}</p>
            <div className="mt-3 space-y-2">
              {checklist.map((item) => (
                <ChecklistItem key={item.label} label={item.label} valid={item.valid} />
              ))}
            </div>
          </div>

          {feedback ? (
            <InlineNotice error={Object.keys(errors).length > 0}>{feedback}</InlineNotice>
          ) : null}

          <div className="mt-5 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="rm-button-primary w-full disabled:opacity-60"
            >
              {loading ? t("common.saving") : t("shiftForm.submit")}
            </button>

            <div className="grid gap-3">
              <Link href="/" className="rm-button-secondary">
                {t("common.backToDashboard")}
              </Link>
              <Link href="/history" className="rm-button-secondary">
                {t("common.viewHistory")}
              </Link>
            </div>
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

          <button
            type="submit"
            disabled={loading}
            className="rm-button-primary shrink-0 px-5 disabled:opacity-60"
          >
            {loading ? t("common.saving") : t("shiftForm.submit")}
          </button>
        </div>
      </div>
    </form>
  );
}

function FlowCard({
  eyebrow,
  title,
  description,
  icon,
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${className ?? ""}`}>
      <div className="rm-surface-strong p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] bg-orange-50 text-orange-600">
            {icon}
          </div>
          <div>
            <div className="rm-pill">{eyebrow}</div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-5">{children}</div>
      </div>
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
        inputMode="decimal"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(Boolean(error))}
      />
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
  startTime,
  endTime,
  t,
}: {
  title: string;
  mode: "auto" | "manual";
  onModeChange: (mode: "auto" | "manual") => void;
  derivedLabel: string;
  manualValue: string;
  onManualChange: (value: string) => void;
  error?: string;
  startTime: string;
  endTime: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="rm-subtle-card p-4">
      <p className="rm-field-label">{title}</p>
      <div className="rm-segmented-control">
        <button
          type="button"
          onClick={() => onModeChange("auto")}
          className={`rm-segmented-button ${mode === "auto" ? "rm-segmented-button-active" : ""}`}
        >
          {t("shiftForm.duration.auto")}
        </button>
        <button
          type="button"
          onClick={() => onModeChange("manual")}
          className={`rm-segmented-button ${mode === "manual" ? "rm-segmented-button-active" : ""}`}
        >
          {t("shiftForm.duration.manual")}
        </button>
      </div>

      {mode === "auto" ? (
        <div className="mt-4">
          <p className="text-2xl font-semibold tracking-tight text-slate-950">{derivedLabel}</p>
          <p className="mt-2 text-sm text-slate-500">
            {startTime && endTime ? `${startTime} - ${endTime}` : t("shiftForm.duration.awaiting")}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            min="0"
            value={manualValue}
            onChange={(event) => onManualChange(event.target.value)}
            className={inputClass(Boolean(error))}
          />
          <p className={`rm-field-helper ${error ? "text-rose-600" : "text-slate-500"}`}>
            {error || t("shiftForm.duration.manualHelp")}
          </p>
        </div>
      )}
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
        <Clock3 size={12} className={valid ? "hidden" : "block"} />
        <span className={valid ? "block text-[11px] font-semibold" : "hidden"}>✓</span>
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

function inputClass(hasError: boolean) {
  return `rm-input ${hasError ? "border-rose-300 bg-rose-50/80" : ""}`;
}

function getPlatformLabel(platform: string) {
  if (platform === "wolt") {
    return "Wolt";
  }

  if (platform === "freelance") {
    return "Freelance";
  }

  return platform;
}
