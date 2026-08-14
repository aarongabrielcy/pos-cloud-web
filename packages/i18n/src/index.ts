/**
 * Package boundary only (WEB-01A#26) - Vendor Admin is single-locale (en) today, so this
 * deliberately does not pull in a localization framework. It exists so that when a second locale is
 * actually needed, message keys/lookups have exactly one place to move into rather than being
 * threaded out of scattered inline strings after the fact.
 */
export type LocaleCode = "en";

export const defaultLocale: LocaleCode = "en";

export type Messages = Record<string, string>;

export const messages: Record<LocaleCode, Messages> = {
  en: {},
};

export function t(key: string, locale: LocaleCode = defaultLocale): string {
  return messages[locale][key] ?? key;
}
