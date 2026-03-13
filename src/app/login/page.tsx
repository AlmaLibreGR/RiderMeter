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
    <main className="rm-page-shell">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <section className="rm-hero p-8">
          <div className="rm-pill">{t("common.appName")}</div>
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

            <button
              type="submit"
              disabled={loading}
              className="rm-button-primary w-full disabled:opacity-60"
            >
              {loading ? t("common.saving") : t("auth.submitLogin")}
            </button>

            {message ? <p className="text-sm text-rose-600">{message}</p> : null}
          </form>

          <p className="mt-6 text-sm text-slate-600">
            {t("auth.switchToRegister")}{" "}
            <Link
              href="/register"
              className="font-medium text-orange-600 underline decoration-orange-300 underline-offset-4"
            >
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
      <label className="rm-field-label">{label}</label>
      {children}
    </div>
  );
}
