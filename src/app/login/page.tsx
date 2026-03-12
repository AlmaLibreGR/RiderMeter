"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(name: "email" | "password", value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.ok) {
      setMessage("Έγινε σύνδεση.");
      router.push("/");
      router.refresh();
    } else {
      setMessage(data.error || "Κάτι πήγε στραβά.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Σύνδεση</h1>
        <p className="mt-2 text-slate-600">
          Σύνδεση στον λογαριασμό σου.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
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
              onChange={(e) => updateField("password", e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="Ο κωδικός σου"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white disabled:opacity-60"
          >
            {loading ? "Γίνεται σύνδεση..." : "Σύνδεση"}
          </button>

          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Δεν έχεις λογαριασμό;{" "}
          <Link href="/register" className="font-medium text-slate-900 underline">
            Εγγραφή
          </Link>
        </p>
      </div>
    </main>
  );
}