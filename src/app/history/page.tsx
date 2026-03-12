import HistoryBrowser from "@/components/history-browser";
import LogoutButton from "@/components/logout-button";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getCurrentLocale, getMessages, translateMessage } from "@/lib/i18n";
import { getDashboardDataset } from "@/services/dashboard-service";

export default async function HistoryPage() {
  const currentUser = await getCurrentUserFromCookie();
  const locale = await getCurrentLocale();
  const messages = getMessages(locale);

  if (!currentUser) {
    return null;
  }

  const dataset = await getDashboardDataset({
    userId: currentUser.userId,
    period: "month",
  });
  const t = (key: string) => translateMessage(messages, key);

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[36px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(248,250,252,0.82))] p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {t("history.eyebrow")}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                {t("history.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                {t("history.body")}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <LanguageSwitcher />
              <LogoutButton />
            </div>
          </div>
        </section>

        <HistoryBrowser
          shifts={dataset.shifts}
          locale={locale}
          currency={dataset.settings.currency}
          timezone={dataset.settings.timezone}
        />
      </div>
    </main>
  );
}
