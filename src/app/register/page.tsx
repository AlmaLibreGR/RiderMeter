"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LanguageSwitcher from "@/components/ui/language-switcher";

export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale() as "en" | "el";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, locale: selectedLocale }),
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
    <main className="rm-page-shell">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rm-accent-panel">
            <div className="rm-pill">{t("common.appName")}</div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl md:leading-[1.02]">
              {t("auth.registerTitle")}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100/80">{t("auth.registerBody")}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <FeaturePill title={t("dashboard.sections.operations")} body={t("dashboard.charts.trendBody")} />
              <FeaturePill title={t("dashboard.sections.insights")} body={t("dashboard.benchmarks.body")} />
              <FeaturePill title={t("dashboard.sections.setup")} body={t("dashboard.setup.vehicleBody")} />
            </div>
          </div>

          <section className="rm-surface-strong p-8">
            <div className="rm-pill">{t("common.register")}</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              {t("auth.submitRegister")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t("nav.cockpit")}</p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
              <Field label={t("auth.email")}>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rm-input"
                  placeholder="you@example.com"
                />
              </Field>
              <Field label={t("auth.password")}>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rm-input"
                  placeholder={locale === "el" ? "Τουλάχιστον 8 χαρακτήρες" : "At least 8 characters"}
                />
              </Field>
              <Field label={t("auth.locale")}>
                <select
                  value={selectedLocale}
                  onChange={(event) => setSelectedLocale(event.target.value as "en" | "el")}
                  className="rm-input"
                >
                  <option value="el">{t("common.greek")}</option>
                  <option value="en">{t("common.english")}</option>
                </select>
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="rm-button-primary w-full disabled:opacity-60"
              >
                {loading ? t("common.saving") : t("auth.submitRegister")}
              </button>

              {message ? <p className="text-sm text-rose-600">{message}</p> : null}
            </form>

            <p className="mt-6 text-sm text-slate-600">
              {t("auth.switchToLogin")}{" "}
              <Link
                href="/login"
                className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-4"
              >
                {t("common.login")}
              </Link>
            </p>
          </section>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="rm-field-label">{label}</label>
      {children}
    </div>
  );
}

function FeaturePill({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-blue-100/75">{body}</p>
    </div>
  );
}
