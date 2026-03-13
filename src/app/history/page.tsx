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
    <main className="rm-page-shell">
      <div className="rm-page-container">
        <section className="rm-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="rm-pill">
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
