export const LOCALE_STORAGE_KEY = "cs2-locale";

export type AppLocale = "zh" | "en";

export function getDeviceLocale(): AppLocale {
  const raw = navigator.language || navigator.languages?.[0] || "en";
  if (raw.toLowerCase().startsWith("zh")) return "zh";
  return "en";
}

export function getStoredLocale(): AppLocale | null {
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (v === "zh" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveInitialLocale(): AppLocale {
  return getStoredLocale() ?? getDeviceLocale();
}

export function persistLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}
