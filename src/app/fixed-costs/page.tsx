"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type FixedCostsForm = {
  insuranceMonthly: string;
  phoneMonthly: string;
  accountantMonthly: string;
  roadTaxMonthly: string;
  kteoMonthly: string;
  otherMonthly: string;
};

const initialForm: FixedCostsForm = {
  insuranceMonthly: "",
  phoneMonthly: "",
  accountantMonthly: "",
  roadTaxMonthly: "",
  kteoMonthly: "",
  otherMonthly: "",
};

export default function FixedCostsPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [form, setForm] = useState<FixedCostsForm>(initialForm);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      const meRes = await fetch("/api/me");
      if (!meRes.ok) {
        setAuthorized(false);
        return;
      }

      setAuthorized(true);

      const res = await fetch("/api/fixed-costs");
      const data = await res.json();

      if (data) {
        setForm({
          insuranceMonthly: String(data.insuranceMonthly ?? ""),
          phoneMonthly: String(data.phoneMonthly ?? ""),
          accountantMonthly: String(data.accountantMonthly ?? ""),
          roadTaxMonthly: String(data.roadTaxMonthly ?? ""),
          kteoMonthly: String(data.kteoMonthly ?? ""),
          otherMonthly: String(data.otherMonthly ?? ""),
        });
      }
    }

    init();
  }, []);

  function updateField(name: keyof FixedCostsForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Αποθήκευση...");

    const res = await fetch("/api/fixed-costs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.ok) {
      setMessage("Τα πάγια έξοδα αποθηκεύτηκαν.");
    } else {
      setMessage(data.error || "Κάτι πήγε στραβά.");
    }
  }

  const monthlyTotal =
    Number(form.insuranceMonthly || 0) +
    Number(form.phoneMonthly || 0) +
    Number(form.accountantMonthly || 0) +
    Number(form.roadTaxMonthly || 0) +
    Number(form.kteoMonthly || 0) +
    Number(form.otherMonthly || 0);

  const dailyFixedCost = monthlyTotal / 30;

  if (authorized === null) {
    return <main className="min-h-screen bg-slate-50 p-4 md:p-6">Φόρτωση...</main>;
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Πάγια Έξοδα</h1>
          <p className="mt-2 text-slate-600">
            Πρέπει να συνδεθείς για να δεις τα πάγια έξοδα.
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
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Πάγια Έξοδα</h1>
        <p className="mt-2 text-slate-600">
          Ρύθμισε τα μηνιαία πάγια ώστε να υπολογίζονται πιο σωστά τα καθαρά.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <Field label="Ασφάλεια / μήνα (€)" value={form.insuranceMonthly} onChange={(value) => updateField("insuranceMonthly", value)} />
          <Field label="Κινητό / data / μήνα (€)" value={form.phoneMonthly} onChange={(value) => updateField("phoneMonthly", value)} />
          <Field label="Λογιστής / μήνα (€)" value={form.accountantMonthly} onChange={(value) => updateField("accountantMonthly", value)} />
          <Field label="Τέλη κυκλοφορίας / μήνα (€)" value={form.roadTaxMonthly} onChange={(value) => updateField("roadTaxMonthly", value)} />
          <Field label="ΚΤΕΟ / μήνα (€)" value={form.kteoMonthly} onChange={(value) => updateField("kteoMonthly", value)} />
          <Field label="Λοιπά πάγια / μήνα (€)" value={form.otherMonthly} onChange={(value) => updateField("otherMonthly", value)} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-slate-500">Σύνολο παγίων / μήνα</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                €{monthlyTotal.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm text-slate-500">Ημερήσιο πάγιο κόστος</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                €{dailyFixedCost.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white"
          >
            Αποθήκευση παγίων εξόδων
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
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
      />
    </div>
  );
}