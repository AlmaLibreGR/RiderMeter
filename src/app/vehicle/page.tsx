"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type VehicleForm = {
  vehicleType: string;
  fuelType: string;
  consumptionPer100Km: string;
  fuelPrice: string;
  maintenancePerKm: string;
  tiresPerKm: string;
  depreciationPerKm: string;
};

const initialForm: VehicleForm = {
  vehicleType: "scooter",
  fuelType: "petrol",
  consumptionPer100Km: "",
  fuelPrice: "",
  maintenancePerKm: "",
  tiresPerKm: "",
  depreciationPerKm: "",
};

export default function VehiclePage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [form, setForm] = useState<VehicleForm>(initialForm);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      const meRes = await fetch("/api/me");
      if (!meRes.ok) {
        setAuthorized(false);
        return;
      }

      setAuthorized(true);

      const res = await fetch("/api/vehicle");
      const data = await res.json();

      if (data) {
        setForm({
          vehicleType: data.vehicleType ?? "scooter",
          fuelType: data.fuelType ?? "petrol",
          consumptionPer100Km: String(data.consumptionPer100Km ?? ""),
          fuelPrice: String(data.fuelPrice ?? ""),
          maintenancePerKm: String(data.maintenancePerKm ?? ""),
          tiresPerKm: String(data.tiresPerKm ?? ""),
          depreciationPerKm: String(data.depreciationPerKm ?? ""),
        });
      }
    }

    init();
  }, []);

  function updateField(name: keyof VehicleForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Αποθήκευση...");

    const res = await fetch("/api/vehicle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.ok) {
      setMessage("Τα στοιχεία οχήματος αποθηκεύτηκαν.");
    } else {
      setMessage(data.error || "Κάτι πήγε στραβά.");
    }
  }

  const fuelPrice = Number(form.fuelPrice || 0);
  const consumption = Number(form.consumptionPer100Km || 0);
  const maintenance = Number(form.maintenancePerKm || 0);
  const tires = Number(form.tiresPerKm || 0);
  const depreciation = Number(form.depreciationPerKm || 0);

  const fuelCostPerKm = (fuelPrice * consumption) / 100;
  const totalCostPerKm = fuelCostPerKm + maintenance + tires + depreciation;

  if (authorized === null) {
    return <main className="min-h-screen bg-slate-50 p-6">Φόρτωση...</main>;
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Όχημα & Κόστη</h1>
          <p className="mt-2 text-slate-600">
            Πρέπει να συνδεθείς για να δεις τα στοιχεία οχήματος.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white"
            >
              Σύνδεση
            </Link>

            <Link
              href="/register"
              className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-900"
            >
              Εγγραφή
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Όχημα & Κόστη</h1>
        <p className="mt-2 text-slate-600">
          Ρύθμισε το όχημά σου ώστε να υπολογίζονται σωστά τα καθαρά.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Τύπος οχήματος
            </label>
            <select
              value={form.vehicleType}
              onChange={(e) => updateField("vehicleType", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="scooter">Scooter</option>
              <option value="motorcycle">Μηχανή</option>
              <option value="car">Αυτοκίνητο</option>
              <option value="ebike">E-Bike</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Καύσιμο
            </label>
            <select
              value={form.fuelType}
              onChange={(e) => updateField("fuelType", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="petrol">Βενζίνη</option>
              <option value="diesel">Πετρέλαιο</option>
              <option value="electric">Ηλεκτρικό</option>
            </select>
          </div>

          <Field label="Κατανάλωση ανά 100 χλμ" value={form.consumptionPer100Km} onChange={(value) => updateField("consumptionPer100Km", value)} />
          <Field label="Τιμή καυσίμου ανά λίτρο (€)" value={form.fuelPrice} onChange={(value) => updateField("fuelPrice", value)} />
          <Field label="Συντήρηση ανά χλμ (€)" value={form.maintenancePerKm} onChange={(value) => updateField("maintenancePerKm", value)} />
          <Field label="Λάστιχα ανά χλμ (€)" value={form.tiresPerKm} onChange={(value) => updateField("tiresPerKm", value)} />
          <Field label="Απόσβεση ανά χλμ (€)" value={form.depreciationPerKm} onChange={(value) => updateField("depreciationPerKm", value)} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-slate-500">Κόστος καυσίμου / χλμ</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                €{fuelCostPerKm.toFixed(3)}
              </p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm text-slate-500">Συνολικό κόστος / χλμ</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                €{totalCostPerKm.toFixed(3)}
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white"
          >
            Αποθήκευση στοιχείων οχήματος
          </button>

          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </form>
      </div>
    </main>
  );
}

function Field({
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
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type="number"
        step="0.001"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3"
      />
    </div>
  );
}