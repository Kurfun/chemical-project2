<script setup lang="ts">
import type { MoleculeConfig } from './type4';

const props = defineProps<{
  activeMolecule: MoleculeConfig;
}>();

const emit = defineEmits<{
  (e: 'open-vsepr'): void;
}>();
</script>

<template>
  <div class="hint-panel">
    <div class="hint-header" @click="emit('open-vsepr')" title="點擊查看 VSEPR 科普">
      <div class="hint-title-row">
        <span style="font-size:14px;">💡</span>
        <span class="hint-title">VSEPR 空間提示</span>
        <span class="hint-shape-badge">{{ props.activeMolecule.shape }}</span>
      </div>
      <span class="hint-expand-icon">▼</span>
    </div>
    <div class="hint-rows-wrap">
      <div
        v-for="hint in props.activeMolecule.hints"
        :key="hint[0]"
        class="hint-row"
        :class="{ hybrid: hint[0].includes('混成') }"
      >
        <span class="hint-key">{{ hint[0] }}</span>
        <span class="hint-val">
          <span v-if="hint[0].includes('混成')" style="font-weight:700;font-style:italic;color:#1a3a6e">
            {{ hint[1] }}
          </span>
          <span v-else>{{ hint[1] }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hint-panel {
  background: #ffffff;
  border: 1.5px solid #1a3a6e;
  border-radius: 6px;
  overflow: hidden;
}
.hint-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 13px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.hint-header:hover { background: #f4f1ea; }
.hint-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hint-title {
  font-size: 11px;
  font-weight: 700;
  color: #1a3a6e;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.hint-shape-badge {
  background: #f4f1ea;
  color: #1a3a6e;
  border: 1px solid #1a3a6e;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}
.hint-expand-icon {
  font-size: 11px;
  color: #1a3a6e;
  transition: transform 0.25s;
  flex-shrink: 0;
}
.hint-rows-wrap { padding: 0 13px 10px; display: block; }
.hint-row {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  padding: 5px 0;
  border-bottom: 1px dashed #ddd8cc;
}
.hint-row:last-child { border-bottom: none; }
.hint-key { color: #8a8070; font-weight: 600; }
.hint-val { color: #1a3a6e; font-weight: 700; }
.hint-row.hybrid { background: #f4f1ea; border-radius: 4px; padding: 5px 8px; margin: 2px -8px; }
</style>