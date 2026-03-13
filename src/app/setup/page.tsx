import LogoutButton from "@/components/logout-button";
import SetupWorkspace from "@/components/forms/setup-workspace";
import MobileTabBar from "@/components/ui/mobile-tab-bar";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getCurrentLocale, getMessages, translateMessage } from "@/lib/i18n";
import { getUserSettingsSnapshot } from "@/services/settings-service";
import { getSetupSnapshot } from "@/services/setup-service";

type SetupPageProps = {
  searchParams?: Promise<{
    onboarding?: string;
    step?: string;
  }>;
};

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const currentUser = await getCurrentUserFromCookie();
  const locale = await getCurrentLocale();
  const messages = getMessages(locale);
  const params = searchParams ? await searchParams : undefined;

  if (!currentUser) {
    return null;
  }

  const [settings, setup] = await Promise.all([
    getUserSettingsSnapshot(currentUser.userId),
    getSetupSnapshot(currentUser.userId),
  ]);
  const t = (key: string) => translateMessage(messages, key);
  const isOnboarding = params?.onboarding === "1" || !settings.onboardingCompleted;
  const initialStep =
    params?.step === "expenses" || params?.step === "categories" || params?.step === "vehicle"
      ? params.step
      : undefined;

  return (
    <main className="rm-page-shell">
      <div className="rm-page-container-compact">
        <section className="rm-spotlight">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="rm-pill">
                {isOnboarding ? t("setupWorkspace.eyebrow") : t("common.settings")}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                {isOnboarding ? t("setupWorkspace.title") : t("setupWorkspace.settingsTitle")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {isOnboarding ? t("setupWorkspace.body") : t("setupWorkspace.settingsBody")}
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
          isOnboarding={isOnboarding}
          initialStep={initialStep}
        />
      </div>
      <MobileTabBar isAdmin={currentUser.roleType === "admin"} />
    </main>
  );
}
