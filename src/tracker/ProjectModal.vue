<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="modal modal-sm">
      <div class="modal-header">
        <div>
          <h3>新增研究課題</h3>
          <p>建立專屬的課題，幫助您系統化分類各領域的文獻。</p>
        </div>
        <button class="close-btn" @click="emit('close')">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div>
          <label class="field-label">課題名稱 *</label>
          <input 
            v-model="form.name" 
            class="form-input" 
            type="text" 
            placeholder="例如：合成反應設計" 
            ref="nameInput"
          />
        </div>
        <div>
          <label class="field-label">簡短描述</label>
          <textarea 
            v-model="form.description" 
            class="form-textarea" 
            rows="2" 
            placeholder="研究目標、範圍或主要参考分子..."
          ></textarea>
        </div>
        <div>
          <label class="field-label" style="margin-bottom:8px">色彩標籤</label>
          <div class="color-swatches">
            <div 
              v-for="color in availableColors" 
              :key="color"
              class="swatch"
              :class="{ selected: form.color === color }"
              :style="{ background: color }"
              @click="form.color = color"
            ></div>
          </div>
        </div>
      </div>

      <div class="modal-footer footer-end">
        <div class="footer-right-btns">
          <button class="btn btn-ghost" @click="emit('close')">取消</button>
          <button class="btn btn-primary" @click="handleSubmit">建立課題</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, nextTick } from 'vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close', 'submit']);

const nameInput = ref<HTMLInputElement | null>(null);
const availableColors = ['#1a3a6e', '#10B981', '#3B82F6', '#EF4444', '#c8a84b', '#EC4899', '#14B8A6']; // 色彩對齊主專案深藍、黃金等底色

const form = reactive({
  name: '',
  description: '',
  color: '#1a3a6e'
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.name = '';
    form.description = '';
    form.color = '#1a3a6e';
    nextTick(() => {
      nameInput.value?.focus();
    });
  }
});

const handleSubmit = () => {
  if (!form.name.trim()) {
    nameInput.value?.focus();
    return;
  }
  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim(),
    color: form.color
  });
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 58, 110, 0.45);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal {
  background: #ffffff;
  border: 1.5px solid #1a3a6e;
  border-radius: 8px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 10px 30px rgba(26, 58, 110, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 92vh;
}
.modal-sm { max-width: 400px; }
.modal-header {
  padding: 15px 18px;
  border-bottom: 1px solid #e6dfd3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f4f1ea;
  border-radius: 6px 6px 0 0;
}
.modal-header h3 { font-size: 13px; font-weight: 700; color: #1a3a6e; }
.modal-header p { font-size: 10px; color: #8a8070; margin-top: 2px; }
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #1a3a6e;
  display: flex;
  align-items: center;
  border-radius: 6px;
  padding: 3px;
}
.close-btn:hover { background: #e6dfd3; }
.modal-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 13px; }
.modal-footer {
  padding: 12px 18px;
  border-top: 1px solid #e6dfd3;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-end { justify-content: flex-end; }
.footer-right-btns { display: flex; gap: 8px; }
label.field-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: #1a3a6e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}
.form-input, .form-textarea {
  width: 100%;
  background: #ffffff;
  border: 1.5px solid #c8b89a;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 12px;
  font-family: inherit;
  color: #1a3a6e;
  outline: none;
}
.form-input:focus, .form-textarea:focus {
  border-color: #1a3a6e;
  box-shadow: 0 0 0 2px rgba(26, 58, 110, 0.08);
}
.form-textarea { resize: none; }
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  border: none;
  cursor: pointer;
}
.btn-primary { background: #1a3a6e; color: #fff; }
.btn-primary:hover { background: #12284c; }
.btn-ghost { background: #f4f1ea; border: 1.5px solid #c8b89a; color: #1a3a6e; }
.btn-ghost:hover { background: #e6dfd3; }
.color-swatches { display: flex; gap: 8px; flex-wrap: wrap; }
.swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.12s;
}
.swatch.selected { border-color: #1a3a6e; transform: scale(1.15); }
</style>