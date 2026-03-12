"use client";

import Link from "next/link";
import { CalendarDays, Filter, MapPin, Package, Route, Wallet } from "lucide-react";
import { useState } from "react";

export type HistoryShift = {
  id: number;
  date: string;
  platform: string;
  area: string;
  hours: number;
  ordersCount: number;
  kilometers: number;
  platformEarnings: number;
  tipsCard: number;
  tipsCash: number;
  bonus: number;
  notes: string | null;
};

type HistoryBrowserProps = {
  shifts: HistoryShift[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("el-GR", {
    maximumFractionDigits: 2,
  }).format(value || 0);
}

const platformLabels: Record<string, string> = {
  efood: "efood",
  wolt: "Wolt",
  both: "efood + Wolt",
};

export default function HistoryBrowser({ shifts }: HistoryBrowserProps) {
  const [platform, setPlatform] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredShifts = shifts.filter((shift) => {
    const shiftDate = shift.date.slice(0, 10);

    if (platform !== "all" && shift.platform !== platform) {
      return false;
    }

    if (dateFrom && shiftDate < dateFrom) {
      return false;
    }

    if (dateTo && shiftDate > dateTo) {
      return false;
    }

    return true;
  });

  const summary = filteredShifts.reduce(
    (acc, shift) => {
      const tips = shift.tipsCard + shift.tipsCash;
      const revenue = shift.platformEarnings + shift.bonus + tips;

      acc.shifts += 1;
      acc.revenue += revenue;
      acc.hours += shift.hours;
      acc.orders += shift.ordersCount;

      return acc;
    },
    {
      shifts: 0,
      revenue: 0,
      hours: 0,
      orders: 0,
    }
  );

  const hasActiveFilters = platform !== "all" || Boolean(dateFrom) || Boolean(dateTo);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <Filter size={14} />
              Φίλτρα ιστορικού
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">
              Βρες γρήγορα τις βάρδιες που σε ενδιαφέρουν
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Φίλτραρε ανά πλατφόρμα και εύρος ημερομηνιών χωρίς να χαθείς στη
              λίστα.
            </p>
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setPlatform("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            >
              Καθαρισμός φίλτρων
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Πλατφόρμα
            </label>
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
            >
              <option value="all">Όλες</option>
              <option value="efood">efood</option>
              <option value="wolt">Wolt</option>
              <option value="both">efood + Wolt</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Από ημερομηνία
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Έως ημερομηνία
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Βάρδιες" value={formatNumber(summary.shifts)} />
        <SummaryCard label="Μικτά" value={formatCurrency(summary.revenue)} />
        <SummaryCard label="Ώρες" value={formatNumber(summary.hours)} />
        <SummaryCard label="Παραγγελίες" value={formatNumber(summary.orders)} />
      </section>

      {filteredShifts.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-white/75 p-8 text-center shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">
            Δεν βρέθηκαν βάρδιες με αυτά τα φίλτρα
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Δοκίμασε να αλλάξεις τα φίλτρα ή να προσθέσεις μια νέα βάρδια για να
            ξεκινήσεις να χτίζεις ιστορικό.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/new-shift"
              className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white"
            >
              Καταχώριση βάρδιας
            </Link>
            <button
              type="button"
              onClick={() => {
                setPlatform("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900"
            >
              Επαναφορά φίλτρων
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          {filteredShifts.map((shift) => {
            const tipsTotal = shift.tipsCard + shift.tipsCash;
            const totalRevenue = shift.platformEarnings + shift.bonus + tipsTotal;

            return (
              <article
                key={shift.id}
                className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {platformLabels[shift.platform] ?? shift.platform}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {new Date(shift.date).toLocaleDateString("el-GR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        {shift.area}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Μια καθαρή ματιά στη βάρδια σου με έμφαση σε χρόνο,
                        διαδρομή και έσοδα.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white shadow-sm lg:min-w-48">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                      Μικτά
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatCurrency(totalRevenue)}
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      Tips: {formatCurrency(tipsTotal)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <ShiftMeta
                    icon={CalendarDays}
                    label="Ημερομηνία"
                    value={new Date(shift.date).toLocaleDateString("el-GR")}
                  />
                  <ShiftMeta
                    icon={Package}
                    label="Παραγγελίες"
                    value={formatNumber(shift.ordersCount)}
                  />
                  <ShiftMeta
                    icon={Route}
                    label="Χιλιόμετρα"
                    value={formatNumber(shift.kilometers)}
                  />
                  <ShiftMeta
                    icon={Wallet}
                    label="Ώρες"
                    value={formatNumber(shift.hours)}
                  />
                </div>

                {shift.notes ? (
                  <div className="mt-4 rounded-3xl border border-amber-200/70 bg-amber-50/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                      <MapPin size={16} />
                      Σημειώσεις βάρδιας
                    </div>
                    <p className="mt-2 text-sm leading-6 text-amber-950/80">
                      {shift.notes}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/85 p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ShiftMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon size={16} />
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
