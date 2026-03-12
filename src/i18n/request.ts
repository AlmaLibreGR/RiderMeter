import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { getMessages, localeCookieName } from "@/lib/i18n";
import type { AppLocale } from "@/types/domain";

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = store.get(localeCookieName)?.value === "en" ? "en" : "el";

  return {
    locale: locale as AppLocale,
    messages: getMessages(locale as AppLocale),
  };
});
