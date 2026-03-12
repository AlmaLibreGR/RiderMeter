import LogoutButton from "@/components/logout-button";
import ShiftEntryForm from "@/components/forms/shift-entry-form";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { nowIsoDate } from "@/lib/dates";
import { getCurrentLocale, getMessages, translateMessage } from "@/lib/i18n";
import { getUserSettingsSnapshot } from "@/services/settings-service";

export default async function NewShiftPage() {
  const currentUser = await getCurrentUserFromCookie();
  const locale = await getCurrentLocale();
  const messages = getMessages(locale);

  if (!currentUser) {
    return null;
  }

  const settings = await getUserSettingsSnapshot(currentUser.userId);
  const t = (key: string) => translateMessage(messages, key);

  return (
    <main className="rm-page-shell">
      <div className="rm-page-container">
        <section className="rm-hero">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="rm-pill">
                {t("shiftForm.eyebrow")}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                {t("shiftForm.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                {t("shiftForm.body")}
              </p>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <LanguageSwitcher />
              <LogoutButton />
            </div>
          </div>
        </section>

        <ShiftEntryForm initialDate={nowIsoDate(settings.timezone)} currency={settings.currency} />
      </div>
    </main>
  );
}
