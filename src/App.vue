<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, RouterView } from "vue-router";
import { SwitchRoot, SwitchThumb } from "reka-ui";
import type { AppLocale } from "@/i18n/locale";
import { persistLocale } from "@/i18n/locale";

const { locale, t } = useI18n();

const englishChecked = computed({
  get: () => locale.value === "en",
  set: (v: boolean) => {
    const next: AppLocale = v ? "en" : "zh";
    locale.value = next;
    persistLocale(next);
  },
});
</script>

<template>
  <div class="app-shell">
    <header class="shell-header">
      <RouterLink to="/" class="shell-brand">
        {{ t("nav.brand") }}
      </RouterLink>
      <nav class="shell-nav">
        <RouterLink to="/weapon-data">
          {{ t("nav.weaponData") }}
        </RouterLink>
        <RouterLink to="/weapon-range">
          {{ t("nav.weaponRange") }}
        </RouterLink>
        <RouterLink to="/map-range">
          {{ t("nav.mapRange") }}
        </RouterLink>
        <RouterLink to="/fall-damage">
          {{ t("nav.fallDamage") }}
        </RouterLink>
        <RouterLink to="/wall-penetration">
          {{ t("nav.wallPenetration") }}
        </RouterLink>
      </nav>
      <div class="shell-lang">
        <span
          class="shell-lang-label"
          :class="{ 'is-active': locale === 'zh' }"
          aria-hidden="true"
        >{{ t("lang.zhShort") }}</span>
        <SwitchRoot
          v-model="englishChecked"
          class="shell-lang-switch"
          :aria-label="t('a11y.languageSwitch')"
        >
          <SwitchThumb class="shell-lang-thumb" />
        </SwitchRoot>
        <span
          class="shell-lang-label"
          :class="{ 'is-active': locale === 'en' }"
          aria-hidden="true"
        >{{ t("lang.enShort") }}</span>
      </div>
    </header>
    <div class="shell-main">
      <RouterView />
    </div>
  </div>
</template>
