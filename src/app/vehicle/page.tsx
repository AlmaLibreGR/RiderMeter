"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { formatCurrency } from "@/lib/formatters";

type VehicleForm = {
  vehicleType: string;
  fuelType: string;
  fuelConsumptionPer100Km: string;
  fuelPricePerLiter: string;
  maintenanceCostPerKm: string;
  tiresCostPerKm: string;
  depreciationCostPerKm: string;
};

const initialForm: VehicleForm = {
  vehicleType: "scooter",
  fuelType: "petrol",
  fuelConsumptionPer100Km: "",
  fuelPricePerLiter: "",
  maintenanceCostPerKm: "",
  tiresCostPerKm: "",
  depreciationCostPerKm: "",
};

export default function VehiclePage() {
  const t = useTranslations();
  const locale = useLocale() as "en" | "el";
  const [form, setForm] = useState<VehicleForm>(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadVehicle() {
      const response = await fetch("/api/vehicle");
      const payload = (await response.json()) as {
        ok: boolean;
        data: {
          vehicleType: string;
          fuelType: string;
          fuelConsumptionPer100Km: number;
          fuelPricePerLiter: number;
          maintenanceCostPerKm: number;
          tiresCostPerKm: number;
          depreciationCostPerKm: number;
        } | null;
      };

      if (!response.ok || !payload.ok || !payload.data) {
        return;
      }

      setForm({
        vehicleType: payload.data.vehicleType,
        fuelType: payload.data.fuelType,
        fuelConsumptionPer100Km: String(payload.data.fuelConsumptionPer100Km ?? ""),
        fuelPricePerLiter: String(payload.data.fuelPricePerLiter ?? ""),
        maintenanceCostPerKm: String(payload.data.maintenanceCostPerKm ?? ""),
        tiresCostPerKm: String(payload.data.tiresCostPerKm ?? ""),
        depreciationCostPerKm: String(payload.data.depreciationCostPerKm ?? ""),
      });
    }

    void loadVehicle();
  }, []);

  const costPerKm = useMemo(() => {
    const fuel = (Number(form.fuelPricePerLiter || 0) * Number(form.fuelConsumptionPer100Km || 0)) / 100;
    return fuel + Number(form.maintenanceCostPerKm || 0) + Number(form.tiresCostPerKm || 0) + Number(form.depreciationCostPerKm || 0);
  }, [form]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/vehicle", {
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
    <main className="rm-page-shell">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <section className="rm-hero p-8">
          <div className="rm-pill">
            {t("settings.vehicleTitle")}
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {t("settings.vehicleTitle")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{t("settings.vehicleBody")}</p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("settings.fields.vehicleType")}>
                <select value={form.vehicleType} onChange={(event) => setForm((current) => ({ ...current, vehicleType: event.target.value }))} className="rm-input">
                  <option value="scooter">Scooter</option>
                  <option value="motorcycle">{locale === "el" ? "Μηχανή" : "Motorcycle"}</option>
                  <option value="car">{locale === "el" ? "Αυτοκίνητο" : "Car"}</option>
                  <option value="ebike">E-Bike</option>
                </select>
              </Field>
              <Field label={t("settings.fields.fuelType")}>
                <select value={form.fuelType} onChange={(event) => setForm((current) => ({ ...current, fuelType: event.target.value }))} className="rm-input">
                  <option value="petrol">{locale === "el" ? "Βενζίνη" : "Petrol"}</option>
                  <option value="diesel">{locale === "el" ? "Πετρέλαιο" : "Diesel"}</option>
                  <option value="electric">{locale === "el" ? "Ηλεκτρικό" : "Electric"}</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <NumberField label={t("settings.fields.fuelConsumptionPer100Km")} value={form.fuelConsumptionPer100Km} onChange={(value) => setForm((current) => ({ ...current, fuelConsumptionPer100Km: value }))} />
              <NumberField label={t("settings.fields.fuelPricePerLiter")} value={form.fuelPricePerLiter} onChange={(value) => setForm((current) => ({ ...current, fuelPricePerLiter: value }))} />
              <NumberField label={t("settings.fields.maintenanceCostPerKm")} value={form.maintenanceCostPerKm} onChange={(value) => setForm((current) => ({ ...current, maintenanceCostPerKm: value }))} />
              <NumberField label={t("settings.fields.tiresCostPerKm")} value={form.tiresCostPerKm} onChange={(value) => setForm((current) => ({ ...current, tiresCostPerKm: value }))} />
              <NumberField label={t("settings.fields.depreciationCostPerKm")} value={form.depreciationCostPerKm} onChange={(value) => setForm((current) => ({ ...current, depreciationCostPerKm: value }))} />
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-5">
              <p className="text-sm text-slate-500">{t("settings.fields.totalCostPerKm")}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatCurrency(costPerKm, locale, "EUR")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={loading} className="rm-button-primary disabled:opacity-60">
                {loading ? t("common.saving") : t("common.save")}
              </button>
              <Link href="/" className="rm-button-secondary">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
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
    <Field label={label}>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rm-input"
      />
    </Field>
  );
}
