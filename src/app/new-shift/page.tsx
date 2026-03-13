import LogoutButton from "@/components/logout-button";
import ShiftEntryForm from "@/components/forms/shift-entry-form";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { nowIsoDate } from "@/lib/dates";
import { getCurrentLocale, getMessages, translateMessage } from "@/lib/i18n";
import { getUserSettingsSnapshot } from "@/services/settings-service";
import { getLatestShiftDraft } from "@/services/shift-service";

export default async function NewShiftPage() {
  const currentUser = await getCurrentUserFromCookie();
  const locale = await getCurrentLocale();
  const messages = getMessages(locale);

  if (!currentUser) {
    return null;
  }

  const settings = await getUserSettingsSnapshot(currentUser.userId);
  const latestDraft = await getLatestShiftDraft(currentUser.userId);
  const t = (key: string) => translateMessage(messages, key);

  return (
    <main className="rm-page-shell">
      <div className="rm-page-container-compact">
        <section className="rm-surface p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="rm-pill">{t("shiftForm.eyebrow")}</div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                {t("shiftForm.title")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {t("shiftForm.body")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <LanguageSwitcher />
              <LogoutButton />
            </div>
          </div>
        </section>

        <ShiftEntryForm
          initialDate={nowIsoDate(settings.timezone)}
          currency={settings.currency}
          timezone={settings.timezone}
          initialDraft={latestDraft}
        />
      </div>
    </main>
  );
}
