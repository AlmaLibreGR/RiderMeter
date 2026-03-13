import LogoutButton from "@/components/logout-button";
import SetupWorkspace from "@/components/forms/setup-workspace";
import MobileTabBar from "@/components/ui/mobile-tab-bar";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getCurrentLocale, getMessages, translateMessage } from "@/lib/i18n";
import { getUserSettingsSnapshot } from "@/services/settings-service";
import { getSetupSnapshot } from "@/services/setup-service";

export default async function SetupPage() {
  const currentUser = await getCurrentUserFromCookie();
  const locale = await getCurrentLocale();
  const messages = getMessages(locale);

  if (!currentUser) {
    return null;
  }

  const [settings, setup] = await Promise.all([
    getUserSettingsSnapshot(currentUser.userId),
    getSetupSnapshot(currentUser.userId),
  ]);
  const t = (key: string) => translateMessage(messages, key);

  return (
    <main className="rm-page-shell">
      <div className="rm-page-container-compact">
        <section className="rm-spotlight">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="rm-pill">{t("setupWorkspace.eyebrow")}</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                {t("setupWorkspace.title")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {t("setupWorkspace.body")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <LanguageSwitcher />
              <LogoutButton />
            </div>
          </div>
        </section>

        <SetupWorkspace
          initialData={setup}
          currency={settings.currency}
          timezone={settings.timezone}
        />
      </div>
      <MobileTabBar isAdmin={currentUser.roleType === "admin"} />
    </main>
  );
}
