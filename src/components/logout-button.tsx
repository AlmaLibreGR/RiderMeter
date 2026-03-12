"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const t = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    await fetch("/api/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300/80 bg-white px-5 py-3 font-medium text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60 md:w-auto"
      aria-label={t("logout")}
    >
      {loading ? `${t("logout")}...` : t("logout")}
    </button>
  );
}
