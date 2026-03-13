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
    <label className="inline-flex items-center gap-2 rounded-2xl border border-orange-100 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-[0_12px_28px_rgba(154,96,54,0.08)]">
      <Globe size={15} className="text-orange-500" />
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        onChange={(event) => handleChange(event.target.value)}
        disabled={isPending}
        className="min-w-20 bg-transparent pr-1 text-sm text-slate-700 outline-none"
      >
        <option value="el">{t("greek")}</option>
        <option value="en">{t("english")}</option>
      </select>
    </label>
  );
}
