import LogoutButton from "@/components/logout-button";
import SetupWorkspace from "@/components/forms/setup-workspace";
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
      <div className="rm-page-container">
        <section className="rm-hero">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="rm-pill">{t("setupWorkspace.eyebrow")}</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                {t("setupWorkspace.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                {t("setupWorkspace.body")}
              </p>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
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
    </main>
  );
}
