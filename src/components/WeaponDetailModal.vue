<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { buildWeaponDetailRows } from "@/lib/weaponDetail";

const props = defineProps<{
  displayName: string;
  columns: Record<string, unknown> | null;
}>();

const open = defineModel<boolean>("open", { default: false });

const { t } = useI18n();

const rows = computed(() =>
  props.columns ? buildWeaponDetailRows(props.columns, t) : [],
);

const rowGroups = computed(() => {
  const groups = [];
  for (let i = 0; i < rows.value.length; i += 2) {
    groups.push(rows.value.slice(i, i + 2));
  }
  return groups;
});
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <DialogContent
        class="dialog-content"
        @pointer-down-outside="open = false"
        @escape-key-down="open = false"
      >
        <DialogTitle class="dialog-title">{{ displayName }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ t("weaponDetail.modalDesc") }}
        </DialogDescription>
        <dl class="detail-dl">
          <template v-for="(group, i) in rowGroups" :key="i">
            <template v-for="(r, j) in group" :key="j">
              <dt>{{ r.label }}</dt>
              <dd>{{ r.value }}</dd>
            </template>
          </template>
        </dl>
        <DialogClose as-child>
          <button type="button" class="rk-btn">{{ t("weaponDetail.close") }}</button>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.detail-dl {
  display: grid;
  grid-template-columns: minmax(7rem, auto) 1fr minmax(7rem, auto) 1fr;
  gap: 0.35rem 1rem;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  max-height: min(60vh, 520px);
  overflow: auto;
}

.detail-dl dt {
  margin: 0;
  color: var(--rk-text);
  opacity: 0.8;
  font-weight: 500;
}

.detail-dl dd {
  margin: 0;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
}

.dialog-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: min(80vw, 800px);
  max-height: 90vh;
  padding: 1.25rem;
  color: var(--rk-text);
  background: var(--rk-bg);
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  box-shadow: 0 20px 50px var(--rk-shadow-lg);
}

.dialog-title {
  margin: 0;
  font-size: 1.1rem;
}
</style>
