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
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[36px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(248,250,252,0.82))] p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
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
