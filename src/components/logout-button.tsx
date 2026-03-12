"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
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
      className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-900 disabled:opacity-60"
      aria-label="Logout"
      tabIndex={0}
    >
      {loading ? "Αποσύνδεση..." : "Αποσύνδεση"}
    </button>
  );
}