"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/formatters";
import type { AppLocale, CurrencyCode, ShiftWithMetrics } from "@/types/domain";

type ShiftPerformanceTableProps = {
  locale: AppLocale;
  currency: CurrencyCode;
  timezone: string;
  title: string;
  columns: {
    date: string;
    hours: string;
    orders: string;
    kilometers: string;
    revenue: string;
    cost: string;
    netProfit: string;
    netPerHour: string;
    margin: string;
    actions: string;
  };
  shifts: ShiftWithMetrics[];
};

type ShiftEditorState = {
  date: string;
  startTime: string;
  endTime: string;
  platform: string;
  area: string;
  hoursWorked: string;
  ordersCompleted: string;
  kilometersDriven: string;
  baseEarnings: string;
  tipsAmount: string;
  bonusAmount: string;
  fuelExpenseDirect: string;
  tollsOrParking: string;
  notes: string;
};

export default function ShiftPerformanceTable({
  locale,
  currency,
  timezone,
  title,
  columns,
  shifts,
}: ShiftPerformanceTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const [editingShift, setEditingShift] = useState<ShiftWithMetrics | null>(null);
  const [draft, setDraft] = useState<ShiftEditorState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleDelete(shiftId: number) {
    const confirmed = window.confirm(t("table.confirmDelete"));
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/shifts/${shiftId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setFeedback(t("table.deleteError"));
      return;
    }

    setFeedback(t("table.deleteSuccess"));
    router.refresh();
  }

  function beginEdit(shift: ShiftWithMetrics) {
    setEditingShift(shift);
    setDraft({
      date: shift.date,
      startTime: shift.startTime ?? "",
      endTime: shift.endTime ?? "",
      platform: shift.platform,
      area: shift.area,
      hoursWorked: String(shift.hoursWorked),
      ordersCompleted: String(shift.ordersCompleted),
      kilometersDriven: String(shift.kilometersDriven),
      baseEarnings: String(shift.baseEarnings),
      tipsAmount: String(shift.tipsAmount),
      bonusAmount: String(shift.bonusAmount),
      fuelExpenseDirect: shift.fuelExpenseDirect == null ? "" : String(shift.fuelExpenseDirect),
      tollsOrParking: String(shift.tollsOrParking),
      notes: shift.notes ?? "",
    });
  }

  async function saveEdit() {
    if (!editingShift || !draft) {
      return;
    }

    setSubmitting(true);
    const response = await fetch(`/api/shifts/${editingShift.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
    });
    setSubmitting(false);

    if (!response.ok) {
      setFeedback(t("table.updateError"));
      return;
    }

    setFeedback(t("table.updateSuccess"));
    setEditingShift(null);
    setDraft(null);
    router.refresh();
  }

  return (
    <section className="rm-surface-strong p-5 md:p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.14em] text-slate-500">
              <th className="pb-3 pr-4 font-medium">{columns.date}</th>
              <th className="pb-3 pr-4 font-medium">{columns.hours}</th>
              <th className="pb-3 pr-4 font-medium">{columns.orders}</th>
              <th className="pb-3 pr-4 font-medium">{columns.kilometers}</th>
              <th className="pb-3 pr-4 font-medium">{columns.revenue}</th>
              <th className="pb-3 pr-4 font-medium">{columns.cost}</th>
              <th className="pb-3 pr-4 font-medium">{columns.netProfit}</th>
              <th className="pb-3 pr-4 font-medium">{columns.netPerHour}</th>
              <th className="pb-3 pr-4 font-medium">{columns.margin}</th>
              <th className="pb-3 font-medium">{columns.actions}</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr
                key={shift.id}
                className="border-b border-slate-900 text-sm text-slate-300 last:border-b-0 hover:bg-slate-900/40"
              >
                <td className="py-4 pr-4">
                  <div>
                    <p className="font-medium text-white">
                      {formatDate(shift.date, locale, timezone)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{shift.platform} · {shift.area}</p>
                  </div>
                </td>
                <td className="py-4 pr-4">{formatNumber(shift.hoursWorked, locale)}</td>
                <td className="py-4 pr-4">{shift.ordersCompleted}</td>
                <td className="py-4 pr-4">{formatNumber(shift.kilometersDriven, locale, 1)}</td>
                <td className="py-4 pr-4">
                  {formatCurrency(shift.metrics.totalRevenue, locale, currency)}
                </td>
                <td className="py-4 pr-4">
                  {formatCurrency(shift.metrics.totalShiftCost, locale, currency)}
                </td>
                <td className="py-4 pr-4 font-semibold text-white">
                  {formatCurrency(shift.metrics.netProfit, locale, currency)}
                </td>
                <td className="py-4 pr-4 font-medium text-emerald-300">
                  {formatCurrency(shift.metrics.netPerHour, locale, currency)}
                </td>
                <td className="py-4 pr-4">
                  {formatPercent(shift.metrics.profitMarginPercent, locale)}
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => beginEdit(shift)}
                      className="inline-flex rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                      aria-label={t("common.edit")}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(shift.id)}
                      className="inline-flex rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                      aria-label={t("common.delete")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingShift && draft ? (
        <div className="mt-6 rounded-[28px] border border-slate-800/90 bg-slate-950/75 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">{t("table.editShift")}</h3>
              <p className="text-sm text-slate-400">{editingShift.area}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingShift(null);
                setDraft(null);
              }}
              className="rm-button-secondary"
            >
              {t("common.cancel")}
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <EditorField label={t("shiftForm.fields.date")}>
              <input
                type="date"
                value={draft.date}
                onChange={(event) =>
                  setDraft((current) => (current ? { ...current, date: event.target.value } : current))
                }
                className="rm-input"
              />
            </EditorField>
            <EditorField label={t("shiftForm.fields.startTime")}>
              <input
                type="time"
                value={draft.startTime}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, startTime: event.target.value } : current
                  )
                }
                className="rm-input"
              />
            </EditorField>
            <EditorField label={t("shiftForm.fields.endTime")}>
              <input
                type="time"
                value={draft.endTime}
                onChange={(event) =>
                  setDraft((current) => (current ? { ...current, endTime: event.target.value } : current))
                }
                className="rm-input"
              />
            </EditorField>
            <EditorField label={t("shiftForm.fields.platform")}>
              <select
                value={draft.platform}
                onChange={(event) =>
                  setDraft((current) => (current ? { ...current, platform: event.target.value } : current))
                }
                className="rm-input"
              >
                <option value="efood">efood</option>
                <option value="wolt">Wolt</option>
                <option value="freelance">Freelance</option>
                <option value="other">{t("table.other")}</option>
              </select>
            </EditorField>
            <EditorField label={t("shiftForm.fields.area")}>
              <input
                type="text"
                value={draft.area}
                onChange={(event) =>
                  setDraft((current) => (current ? { ...current, area: event.target.value } : current))
                }
                className="rm-input"
              />
            </EditorField>
            <EditorField label={t("shiftForm.fields.hoursWorked")}>
              <input
                type="number"
                step="0.01"
                value={draft.hoursWorked}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, hoursWorked: event.target.value } : current
                  )
                }
                className="rm-input"
              />
            </EditorField>
            <EditorField label={t("shiftForm.fields.ordersCompleted")}>
              <input
                type="number"
                step="1"
                value={draft.ordersCompleted}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, ordersCompleted: event.target.value } : current
                  )
                }
                className="rm-input"
              />
            </EditorField>
            <EditorField label={t("shiftForm.fields.kilometersDriven")}>
              <input
                type="number"
                step="0.01"
                value={draft.kilometersDriven}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, kilometersDriven: event.target.value } : current
                  )
                }
                className="rm-input"
              />
            </EditorField>
            <EditorField label={t("shiftForm.fields.baseEarnings")}>
              <input
                type="number"
                step="0.01"
                value={draft.baseEarnings}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, baseEarnings: event.target.value } : current
                  )
                }
                className="rm-input"
              />
            </EditorField>
            <EditorField label={t("shiftForm.fields.tipsAmount")}>
              <input
                type="number"
                step="0.01"
                value={draft.tipsAmount}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, tipsAmount: event.target.value } : current
                  )
                }
                className="rm-input"
              />
            </EditorField>
            <EditorField label={t("shiftForm.fields.bonusAmount")}>
              <input
                type="number"
                step="0.01"
                value={draft.bonusAmount}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, bonusAmount: event.target.value } : current
                  )
                }
                className="rm-input"
              />
            </EditorField>
            <EditorField label={t("shiftForm.fields.fuelExpenseDirect")}>
              <input
                type="number"
                step="0.01"
                value={draft.fuelExpenseDirect}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, fuelExpenseDirect: event.target.value } : current
                  )
                }
                className="rm-input"
              />
            </EditorField>
            <EditorField label={t("shiftForm.fields.tollsOrParking")}>
              <input
                type="number"
                step="0.01"
                value={draft.tollsOrParking}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, tollsOrParking: event.target.value } : current
                  )
                }
                className="rm-input"
              />
            </EditorField>
            <div className="md:col-span-2 xl:col-span-3">
              <EditorField label={t("shiftForm.fields.notes")}>
                <textarea
                  value={draft.notes}
                  onChange={(event) =>
                    setDraft((current) => (current ? { ...current, notes: event.target.value } : current))
                  }
                  className="rm-input min-h-[110px]"
                />
              </EditorField>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveEdit}
              disabled={submitting}
              className="rm-button-primary disabled:opacity-60"
            >
              {submitting ? t("common.saving") : t("common.update")}
            </button>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
          {feedback}
        </div>
      ) : null}
    </section>
  );
}

function EditorField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="rm-field-label">{label}</label>
      {children}
    </div>
  );
}
