"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NewShiftPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    platform: "efood",
    area: "",
    hours: "",
    ordersCount: "",
    kilometers: "",
    platformEarnings: "",
    tipsCard: "",
    tipsCash: "",
    bonus: "",
    notes: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch("/api/me");

      setAuthorized(res.ok);
    }

    checkAuth();
  }, []);

  function updateField(name: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Αποθήκευση...");

    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.ok) {
      setMessage("Η βάρδια αποθηκεύτηκε επιτυχώς.");
      setForm({
        date: new Date().toISOString().slice(0, 10),
        platform: "efood",
        area: "",
        hours: "",
        ordersCount: "",
        kilometers: "",
        platformEarnings: "",
        tipsCard: "",
        tipsCash: "",
        bonus: "",
        notes: "",
      });
    } else {
      setMessage(data.error || "Κάτι πήγε στραβά.");
    }
  }

  if (authorized === null) {
    return <main className="min-h-screen bg-slate-50 p-6">Φόρτωση...</main>;
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Νέα Βάρδια</h1>
          <p className="mt-2 text-slate-600">
            Πρέπει να συνδεθείς για να καταχωρίσεις βάρδια.
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
        <h1 className="text-3xl font-bold text-slate-900">Νέα Βάρδια</h1>
        <p className="mt-2 text-slate-600">
          Καταχώρισε στοιχεία βάρδιας για efood / Wolt.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ημερομηνία
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Πλατφόρμα
            </label>
            <select
              value={form.platform}
              onChange={(e) => updateField("platform", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="efood">efood</option>
              <option value="wolt">Wolt</option>
              <option value="both">Και τα δύο</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Περιοχή
            </label>
            <input
              type="text"
              value={form.area}
              onChange={(e) => updateField("area", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="π.χ. Μαρούσι"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Ώρες" value={form.hours} onChange={(v) => updateField("hours", v)} />
            <Field label="Παραγγελίες" value={form.ordersCount} onChange={(v) => updateField("ordersCount", v)} />
            <Field label="Χιλιόμετρα" value={form.kilometers} onChange={(v) => updateField("kilometers", v)} />
            <Field label="Έσοδα πλατφόρμας (€)" value={form.platformEarnings} onChange={(v) => updateField("platformEarnings", v)} />
            <Field label="Tips κάρτα (€)" value={form.tipsCard} onChange={(v) => updateField("tipsCard", v)} />
            <Field label="Tips μετρητά (€)" value={form.tipsCash} onChange={(v) => updateField("tipsCash", v)} />
            <Field label="Bonus (€)" value={form.bonus} onChange={(v) => updateField("bonus", v)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Σημειώσεις
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="min-h-[100px] w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="Προαιρετικά"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white"
          >
            Αποθήκευση βάρδιας
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
        className="w-full rounded-xl border border-slate-300 px-4 py-3"
      />
    </div>
  );
}