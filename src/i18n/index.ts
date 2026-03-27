import { createI18n } from "vue-i18n";
import zh from "@/locales/zh.json";
import en from "@/locales/en.json";
import { resolveInitialLocale } from "./locale";

export const i18n = createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: "en",
  messages: { zh, en },
});
