"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { formatCurrency } from "@/lib/formatters";

type CostForm = {
  insuranceMonthly: string;
  phoneMonthly: string;
  accountantMonthly: string;
  roadTaxMonthly: string;
  kteoMonthly: string;
  otherMonthly: string;
};

const initialForm: CostForm = {
  insuranceMonthly: "",
  phoneMonthly: "",
  accountantMonthly: "",
  roadTaxMonthly: "",
  kteoMonthly: "",
  otherMonthly: "",
};

export default function FixedCostsPage() {
  const t = useTranslations();
  const locale = useLocale() as "en" | "el";
  const [form, setForm] = useState<CostForm>(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCosts() {
      const response = await fetch("/api/fixed-costs");
      const payload = (await response.json()) as {
        ok: boolean;
        data: {
          insuranceMonthly: number;
          phoneMonthly: number;
          accountantMonthly: number;
          roadTaxMonthly: number;
          kteoMonthly: number;
          otherMonthly: number;
        } | null;
      };

      if (!response.ok || !payload.ok || !payload.data) {
        return;
      }

      setForm({
        insuranceMonthly: String(payload.data.insuranceMonthly ?? ""),
        phoneMonthly: String(payload.data.phoneMonthly ?? ""),
        accountantMonthly: String(payload.data.accountantMonthly ?? ""),
        roadTaxMonthly: String(payload.data.roadTaxMonthly ?? ""),
        kteoMonthly: String(payload.data.kteoMonthly ?? ""),
        otherMonthly: String(payload.data.otherMonthly ?? ""),
      });
    }

    void loadCosts();
  }, []);

  const monthlyTotal = useMemo(() => {
    return (
      Number(form.insuranceMonthly || 0) +
      Number(form.phoneMonthly || 0) +
      Number(form.accountantMonthly || 0) +
      Number(form.roadTaxMonthly || 0) +
      Number(form.kteoMonthly || 0) +
      Number(form.otherMonthly || 0)
    );
  }, [form]);

  const dailyFixedCost = monthlyTotal / 30;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/fixed-costs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const payload = (await response.json()) as { ok: boolean; error?: string };
    setMessage(payload.ok ? t("settings.saved") : payload.error ?? t("shiftForm.errors.generic"));
    setLoading(false);
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <section className="rounded-[36px] border border-white/70 bg-white/85 p-8 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {t("settings.costTitle")}
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {t("settings.costTitle")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{t("settings.costBody")}</p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <NumberField label={t("settings.fields.insuranceMonthly")} value={form.insuranceMonthly} onChange={(value) => setForm((current) => ({ ...current, insuranceMonthly: value }))} />
              <NumberField label={t("settings.fields.phoneMonthly")} value={form.phoneMonthly} onChange={(value) => setForm((current) => ({ ...current, phoneMonthly: value }))} />
              <NumberField label={t("settings.fields.accountantMonthly")} value={form.accountantMonthly} onChange={(value) => setForm((current) => ({ ...current, accountantMonthly: value }))} />
              <NumberField label={t("settings.fields.roadTaxMonthly")} value={form.roadTaxMonthly} onChange={(value) => setForm((current) => ({ ...current, roadTaxMonthly: value }))} />
              <NumberField label={t("settings.fields.kteoMonthly")} value={form.kteoMonthly} onChange={(value) => setForm((current) => ({ ...current, kteoMonthly: value }))} />
              <NumberField label={t("settings.fields.otherMonthly")} value={form.otherMonthly} onChange={(value) => setForm((current) => ({ ...current, otherMonthly: value }))} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SummaryCard
                label={t("settings.fields.totalMonthlyCost")}
                value={formatCurrency(monthlyTotal, locale, "EUR")}
              />
              <SummaryCard
                label={t("settings.fields.dailyFixedCost")}
                value={formatCurrency(dailyFixedCost, locale, "EUR")}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={loading} className="rounded-2xl bg-slate-950 px-5 py-3 font-medium text-white disabled:opacity-60">
                {loading ? t("common.saving") : t("common.save")}
              </button>
              <Link href="/" className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900">
                {t("common.backToDashboard")}
              </Link>
            </div>

            {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          </form>
        </section>
      </div>
    </main>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none"
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
