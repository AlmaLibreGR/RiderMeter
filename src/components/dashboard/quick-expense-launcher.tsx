"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { nowIsoDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/formatters";
import type { CurrencyCode, ExpenseCategorySnapshot, ExpenseEntrySnapshot } from "@/types/domain";

type QuickExpenseLauncherProps = {
  currency: CurrencyCode;
  timezone: string;
  variant?: "tile" | "panel";
  title?: string;
  body?: string;
};

type ExpensePayload = {
  categories: ExpenseCategorySnapshot[];
  entries: ExpenseEntrySnapshot[];
};

export default function QuickExpenseLauncher({
  currency,
  timezone,
  variant = "tile",
  title,
  body,
}: QuickExpenseLauncherProps) {
  const t = useTranslations();
  const locale = useLocale() as "en" | "el";
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategorySnapshot[]>([]);
  const [recentEntries, setRecentEntries] = useState<ExpenseEntrySnapshot[]>([]);
  const [form, setForm] = useState({
    categoryId: "",
    date: nowIsoDate(timezone),
    amount: "",
    description: "",
  });

  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive),
    [categories]
  );

  useEffect(() => {
    if (!isOpen || categories.length > 0 || isLoading) {
      return;
    }

    let ignore = false;

    async function loadExpenses() {
      setIsLoading(true);
      setFetchError(null);

      try {
        const response = await fetch("/api/expenses", { cache: "no-store" });
        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
          data?: ExpensePayload;
        };

        if (!response.ok || !payload.ok || !payload.data) {
          throw new Error(payload.error ?? t("dashboard.quickExpense.fetchError"));
        }

        if (ignore) {
          return;
        }

        const nextCategories = payload.data.categories.filter((category) => category.isActive);
        setCategories(nextCategories);
        setRecentEntries(payload.data.entries.slice(0, 4));
        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || String(nextCategories[0]?.id ?? ""),
        }));
      } catch (error) {
        if (!ignore) {
          setFetchError(
            error instanceof Error ? error.message : t("dashboard.quickExpense.fetchError")
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadExpenses();

    return () => {
      ignore = true;
    };
  }, [categories.length, isLoading, isOpen, t]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setSaveMessage(null);
    setSaveError(false);

    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        categoryId: Number(form.categoryId),
        amount: Number(form.amount),
        description: form.description.trim() || undefined,
      }),
    });

    const payload = (await response.json()) as {
      ok: boolean;
      error?: string;
      data?: ExpenseEntrySnapshot;
    };

    if (!response.ok || !payload.ok || !payload.data) {
      setIsLoading(false);
      setSaveError(true);
      setSaveMessage(payload.error ?? t("dashboard.quickExpense.saveError"));
      return;
    }

    setRecentEntries((current) => [payload.data!, ...current].slice(0, 4));
    setForm((current) => ({ ...current, amount: "", description: "" }));
    setIsLoading(false);
    setSaveError(false);
    setSaveMessage(t("dashboard.quickExpense.saveSuccess"));
    router.refresh();
  }

  const launcherTitle = title ?? t("dashboard.addExpenseTitle");
  const launcherBody = body ?? t("dashboard.quickExpense.launchBody");

  return (
    <>
      {variant === "tile" ? (
        <button type="button" onClick={() => setIsOpen(true)} className="rm-quick-link-card text-left">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">{launcherTitle}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{launcherBody}</p>
          </div>
          <span className="rm-quick-link-icon">
            <Plus size={18} />
          </span>
        </button>
      ) : (
        <button type="button" onClick={() => setIsOpen(true)} className="rm-setup-item text-left">
          <div className="pr-4">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
              {t("dashboard.quickExpense.fastLabel")}
            </span>
            <p className="mt-3 font-semibold text-slate-950">{launcherTitle}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{launcherBody}</p>
          </div>
          <Plus className="mt-1 shrink-0 text-blue-500" size={18} />
        </button>
      )}

      {isOpen ? (
        <div className="rm-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="quick-expense-title">
          <div className="rm-modal-shell">
            <div className="rm-modal-header">
              <div>
                <p className="rm-pill">{t("dashboard.quickActionsTitle")}</p>
                <h2 id="quick-expense-title" className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {t("dashboard.quickExpense.modalTitle")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("dashboard.quickExpense.modalBody")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rm-icon-button"
                aria-label={t("dashboard.quickExpense.close")}
              >
                <X size={18} />
              </button>
            </div>

            {fetchError ? <div className="rm-soft-note mt-4 text-rose-700">{fetchError}</div> : null}

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div>
                <label className="rm-field-label">{t("dashboard.quickExpense.category")}</label>
                <div className="rm-inline-chip-row">
                  {activeCategories.map((category) => {
                    const active = form.categoryId === String(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, categoryId: String(category.id) }))}
                        className={`rm-inline-chip ${active ? "rm-inline-chip-active" : ""}`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
                {activeCategories.length === 0 && !isLoading ? (
                  <p className="rm-field-helper">{t("dashboard.quickExpense.emptyCategories")}</p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="rm-field-label">{t("dashboard.quickExpense.amount")}</span>
                  <input
                    className="rm-input"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="0"
                    required
                  />
                </label>
                <label className="block">
                  <span className="rm-field-label">{t("dashboard.quickExpense.date")}</span>
                  <input
                    className="rm-input"
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="rm-field-label">{t("dashboard.quickExpense.description")}</span>
                <input
                  className="rm-input"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder={t("dashboard.quickExpense.descriptionPlaceholder")}
                />
              </label>

              {recentEntries.length > 0 ? (
                <div className="rm-modal-subsection">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">
                      {t("dashboard.quickExpense.recent")}
                    </p>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {recentEntries.map((entry) => (
                      <div key={entry.id} className="rm-summary-pair">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{entry.category}</p>
                          <p className="mt-1 text-xs text-slate-500">{entry.date.slice(0, 10)}</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-slate-950">
                          {formatCurrency(entry.amount, locale, currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {saveMessage ? (
                <div className={`rm-soft-note ${saveError ? "text-rose-700" : "text-emerald-700"}`}>
                  {saveMessage}
                </div>
              ) : null}

              <div className="rm-modal-actions">
                <button type="button" onClick={() => setIsOpen(false)} className="rm-button-secondary">
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="rm-button-primary"
                  disabled={isLoading || !form.categoryId || !form.amount}
                >
                  {isLoading ? t("common.saving") : t("dashboard.quickExpense.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
