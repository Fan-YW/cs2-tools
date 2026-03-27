<script setup lang="ts">
import { weaponCategoryLabel } from "@/lib/weaponLoader";
import type { WeaponRow } from "@/lib/weaponLoader";
import { useI18n } from "vue-i18n";
import { ref } from "vue";

defineProps<{
  weaponGroups: [string, WeaponRow[]][];
  selectedIds: string[];
}>();

const { t } = useI18n();

const emit = defineEmits<{
  toggleWeapon: [id: string];
  bulkToggle: [type: string, items: WeaponRow[]];
}>();

const expanded = ref(true);

function onHeaderClick() {
  expanded.value = !expanded.value;
}
</script>

<template>
  <section class="weapon-selector" :aria-label="t('a11y.weaponSelector')">
    <button
      type="button"
      class="weapon-selector-header"
      :aria-expanded="expanded"
      @click="onHeaderClick"
    >
      <span class="weapon-selector-title">{{ t("weapon.selectorTitle") }}</span>
      <span class="weapon-selector-chevron" :class="{ 'is-open': expanded }" aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </button>
    <div v-show="expanded" class="weapon-selector-body">
      <div
        v-for="[type, items] in weaponGroups"
        :key="type"
        class="weapon-tag-row"
      >
        <button
          type="button"
          class="rk-btn rk-btn-ghost weapon-tag-bulk"
          @click="emit('bulkToggle', type, items)"
        >
          {{
            items.every((w) => selectedIds.includes(w.id))
              ? t("weapon.bulkClear", { cat: weaponCategoryLabel(type, t) })
              : t("weapon.bulkAll", { cat: weaponCategoryLabel(type, t) })
          }}
        </button>
        <div class="weapon-tag-list">
          <button
            v-for="w in items"
            :key="w.id"
            type="button"
            class="weapon-tag"
            :class="{ 'is-selected': selectedIds.includes(w.id) }"
            @click="emit('toggleWeapon', w.id)"
          >
            {{ w.displayName || w.id }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.weapon-selector {
  margin-bottom: 0;
}

.weapon-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.5rem;
  padding: 0.4rem 0.15rem;
  margin: 0 0 0.35rem;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  border-radius: 8px;
  text-align: left;
}

.weapon-selector-header:hover {
  background: rgba(0, 0, 0, 0.04);
}

.weapon-selector-header:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 2px;
}

.weapon-selector-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.weapon-selector-chevron {
  display: flex;
  flex-shrink: 0;
  opacity: 0.75;
  transition: transform 0.2s ease;
}

.weapon-selector-chevron.is-open {
  transform: rotate(180deg);
}

.weapon-selector-body {
  margin-top: 0.15rem;
}

.weapon-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-start;
  margin-bottom: 0.6rem;
}

.weapon-tag-bulk {
  flex: 0 0 auto;
  min-width: 7rem;
}

.weapon-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  flex: 1;
  min-width: 0;
}

.weapon-tag {
  border: 1px solid var(--rk-border);
  background: rgba(0, 0, 0, 0.03);
  color: inherit;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

.weapon-tag.is-selected {
  background: rgba(37, 99, 235, 0.12);
  border-color: rgba(37, 99, 235, 0.35);
}
</style>
