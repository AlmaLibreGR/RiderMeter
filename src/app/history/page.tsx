import Link from "next/link";
import HistoryBrowser, { HistoryShift } from "@/components/history-browser";
import LogoutButton from "@/components/logout-button";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HistoryPage() {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <h1 className="text-3xl font-semibold text-slate-900">Ιστορικό βαρδιών</h1>
          <p className="mt-3 text-slate-600">
            Πρέπει να συνδεθείς για να δεις το ιστορικό και τα φίλτρα σου.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white"
            >
              Σύνδεση
            </Link>
            <Link
              href="/register"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900"
            >
              Εγγραφή
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const shifts = await prisma.shift.findMany({
    where: {
      userId: currentUser.userId,
    },
    orderBy: {
      date: "desc",
    },
  });

  const historyShifts: HistoryShift[] = shifts.map((shift) => ({
    id: shift.id,
    date: shift.date.toISOString(),
    platform: shift.platform,
    area: shift.area,
    hours: Number(shift.hours),
    ordersCount: Number(shift.ordersCount),
    kilometers: Number(shift.kilometers),
    platformEarnings: Number(shift.platformEarnings),
    tipsCard: Number(shift.tipsCard),
    tipsCash: Number(shift.tipsCash),
    bonus: Number(shift.bonus),
    notes: shift.notes ?? null,
  }));

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Core flow · Ιστορικό
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Όλες οι βάρδιες σου, σε μια πιο καθαρή εικόνα
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Φιλτράρισε γρήγορα το ιστορικό σου, σύγκρινε περιόδους και βρες
                εύκολα τις βάρδιες που θες να εξετάσεις.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white"
                >
                  Επιστροφή στο dashboard
                </Link>
                <Link
                  href="/new-shift"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900"
                >
                  Νέα βάρδια
                </Link>
              </div>
            </div>

            <LogoutButton />
          </div>
        </section>

        <div className="rounded-[32px] border border-white/70 bg-white/60 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur md:p-6">
          <HistoryBrowser shifts={historyShifts} />
        </div>
      </div>
    </main>
  );
}
