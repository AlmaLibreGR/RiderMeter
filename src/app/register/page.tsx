"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FormState = {
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(name: keyof FormState, value: string) {
    setForm((prev: FormState) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.ok) {
      setMessage("Ο λογαριασμός δημιουργήθηκε.");
      router.push("/");
      router.refresh();
    } else {
      setMessage(data.error || "Κάτι πήγε στραβά.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Εγγραφή</h1>
        <p className="mt-2 text-slate-600">
          Δημιούργησε λογαριασμό για να χρησιμοποιήσεις το Rider KPI.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateField("email", e.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Κωδικός
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateField("password", e.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
              placeholder="Τουλάχιστον 6 χαρακτήρες"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white disabled:opacity-60"
          >
            {loading ? "Γίνεται εγγραφή..." : "Δημιουργία λογαριασμού"}
          </button>

          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Έχεις ήδη λογαριασμό?{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">
            Σύνδεση
          </Link>
        </p>
      </div>
    </main>
  );
}