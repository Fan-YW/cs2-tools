<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";

const { t } = useI18n();
</script>

<template>
  <div class="home-center">
    <div class="home-card">
      <h1>{{ t("home.title") }}</h1>
      <nav class="tool-list">
        <RouterLink to="/weapon-data" class="tool-link">
          {{ t("nav.weaponData") }}
        </RouterLink>
        <RouterLink to="/weapon-range" class="tool-link">
          {{ t("nav.weaponRange") }}
        </RouterLink>
        <RouterLink to="/map-range" class="tool-link">
          {{ t("nav.mapRange") }}
        </RouterLink>
        <RouterLink to="/fall-damage" class="tool-link">
          {{ t("nav.fallDamage") }}
        </RouterLink>
      </nav>

    </div>
  </div>
</template>
