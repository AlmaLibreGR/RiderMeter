"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LanguageSwitcher from "@/components/ui/language-switcher";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale() as "en" | "el";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const payload = (await response.json()) as { ok: boolean; error?: string };

    if (response.ok && payload.ok) {
      router.push("/");
      router.refresh();
      return;
    }

    setMessage(payload.error ?? t("shiftForm.errors.generic"));
    setLoading(false);
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <section className="rounded-[36px] border border-white/70 bg-white/85 p-8 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {t("common.appName")}
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {t("auth.loginTitle")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{t("auth.loginBody")}</p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
            <Field label={t("auth.email")}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass()}
                placeholder="you@example.com"
              />
            </Field>
            <Field label={t("auth.password")}>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass()}
                placeholder={locale === "el" ? "Τουλάχιστον 8 χαρακτήρες" : "At least 8 characters"}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-slate-950 px-5 py-3 font-medium text-white disabled:opacity-60"
            >
              {loading ? t("common.saving") : t("auth.submitLogin")}
            </button>

            {message ? <p className="text-sm text-rose-600">{message}</p> : null}
          </form>

          <p className="mt-6 text-sm text-slate-600">
            {t("auth.switchToRegister")}{" "}
            <Link href="/register" className="font-medium text-slate-900 underline">
              {t("common.register")}
            </Link>
          </p>
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

function inputClass() {
  return "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none";
}
