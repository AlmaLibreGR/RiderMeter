import { cookies } from "next/headers";
import en from "../../messages/en.json";
import el from "../../messages/el.json";
import type { AppLocale } from "@/types/domain";

export const localeCookieName = "locale";

const messagesMap = {
  en,
  el,
} as const;

type Messages = typeof en;

export async function getCurrentLocale(): Promise<AppLocale> {
  const store = await cookies();
  const locale = store.get(localeCookieName)?.value;
  return locale === "en" ? "en" : "el";
}

export function getMessages(locale: AppLocale): Messages {
  return messagesMap[locale];
}

export function translateMessage(
  messages: Record<string, unknown>,
  key: string,
  values?: Record<string, string | number>
) {
  const template = key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[part];
  }, messages);

  if (typeof template !== "string") {
    return key;
  }

  if (!values) {
    return template;
  }

  return Object.entries(values).reduce((result, [name, value]) => {
    return result.replaceAll(`{${name}}`, String(value));
  }, template);
}
