import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookie } from "@/lib/auth";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

export default async function HistoryPage() {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Ιστορικό Βαρδιών</h1>
          <p className="mt-2 text-slate-600">
            Πρέπει να συνδεθείς για να δεις το ιστορικό σου.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white"
            >
              Σύνδεση
            </Link>

            <Link
              href="/register"
              className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-900"
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

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Ιστορικό Βαρδιών</h1>
          <p className="mt-2 text-slate-600">
            Όλες οι καταχωρισμένες βάρδιες σου.
          </p>

          <div className="mt-8 space-y-4">
            {shifts.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-slate-500">
                Δεν υπάρχουν ακόμα βάρδιες.
              </div>
            ) : (
              shifts.map((shift) => {
                const tipsTotal = Number(shift.tipsCard) + Number(shift.tipsCash);
                const totalRevenue =
                  Number(shift.platformEarnings) +
                  Number(shift.bonus) +
                  tipsTotal;

                return (
                  <div
                    key={shift.id}
                    className="rounded-2xl border bg-white p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {shift.platform.toUpperCase()} · {shift.area}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {new Date(shift.date).toLocaleDateString("el-GR")}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div>
                          <p className="text-xs uppercase text-slate-400">Ώρες</p>
                          <p className="font-semibold text-slate-900">{shift.hours}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-400">Παραγγελίες</p>
                          <p className="font-semibold text-slate-900">{shift.ordersCount}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-400">Χλμ</p>
                          <p className="font-semibold text-slate-900">{shift.kilometers}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-400">Έσοδα</p>
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(totalRevenue)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {shift.notes ? (
                      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                        {shift.notes}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}