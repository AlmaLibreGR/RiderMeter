"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(nextLocale: string) {
    startTransition(async () => {
      await fetch("/api/preferences/locale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale: nextLocale }),
      });

      router.refresh();
    });
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 shadow-[0_14px_34px_rgba(2,6,23,0.28)] backdrop-blur">
      <Globe size={15} className="text-sky-300" />
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        onChange={(event) => handleChange(event.target.value)}
        disabled={isPending}
        className="min-w-20 bg-transparent pr-1 text-sm text-slate-100 outline-none"
      >
        <option value="el">{t("greek")}</option>
        <option value="en">{t("english")}</option>
      </select>
    </label>
  );
}
