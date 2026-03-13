import AdminWorkspace from "@/components/admin/admin-workspace";
import LogoutButton from "@/components/logout-button";
import MobileTabBar from "@/components/ui/mobile-tab-bar";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { requireAdminFromCookie } from "@/lib/auth";
import { getCurrentLocale, getMessages, translateMessage } from "@/lib/i18n";
import { getAdminOverviewDataset } from "@/services/admin-service";
import { getUserSettingsSnapshot } from "@/services/settings-service";

export default async function AdminPage() {
  const currentUser = await requireAdminFromCookie();
  const locale = await getCurrentLocale();
  const messages = getMessages(locale);
  const t = (key: string) => translateMessage(messages, key);

  if (!currentUser) {
    return (
      <main className="rm-page-shell">
        <div className="rm-page-container-compact">
          <section className="rm-empty-state">
            <h1 className="text-2xl font-semibold text-slate-950">{t("admin.forbiddenTitle")}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{t("admin.forbiddenBody")}</p>
          </section>
        </div>
      </main>
    );
  }

  const [dataset, settings] = await Promise.all([
    getAdminOverviewDataset(),
    getUserSettingsSnapshot(currentUser.userId),
  ]);

  return (
    <main className="rm-page-shell">
      <div className="rm-page-container-compact">
        <section className="rm-spotlight">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="rm-pill">{t("common.admin")}</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                {t("admin.title")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {t("admin.body")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <LanguageSwitcher />
              <LogoutButton />
            </div>
          </div>
        </section>

        <AdminWorkspace dataset={dataset} locale={locale} timezone={settings.timezone} />
      </div>
      <MobileTabBar isAdmin />
    </main>
  );
}
