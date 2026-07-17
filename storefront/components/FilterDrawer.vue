<template>
  <div v-if="open" class="overlay" @click.self="$emit('close')">
    <aside class="drawer">
      <div class="top">
        <div class="topLeft">
          <span class="sliders" />
          <span class="topTitle">{{ t('filter') }}</span>
        </div>
        <button class="closeBtn" aria-label="Close" @click="$emit('close')">
          <span class="x" />
        </button>
      </div>

      <div class="pillRow" v-if="selectedTypes.length">
        <button class="pill" v-for="typeId in selectedTypes" :key="typeId" @click="$emit('toggle-type', typeId)">
          <span class="xMini" />
          <span>{{ t('productType') }}: {{ productTypes.find(type => type.id === typeId)?.label || typeId }}</span>
        </button>
      </div>

      <div class="section">
        <div class="secTitle">{{ t('availability') }}</div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="inStockOnly"
            @change="$emit('set-in-stock-only', Boolean($event && $event.target && $event.target.checked))"
          />
          <span class="track"><span class="knob" /></span>
          <span class="toggleText">{{ t('inStockOnly') }}</span>
        </label>
      </div>

      <div class="section">
        <div class="secTitle">{{ t('productType') }}</div>
        <div class="checkList">
          <label v-for="typeItem in productTypes" :key="typeItem.id" class="checkItem">
            <input type="checkbox" :checked="selectedTypes.includes(typeItem.id)" @change="$emit('toggle-type', typeItem.id)" />
            <span class="checkBox" />
            <span class="checkText">{{ typeItem.label }}</span>
          </label>
        </div>
      </div>

      <div class="bottom">
        <button class="ghost" @click="$emit('clear')">{{ t('clear') }}</button>
        <button class="primary" @click="$emit('apply')">{{ t('apply') }}</button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import type { CatalogCategoryOption } from '../composables/mockCatalog'
import { useI18n } from '../composables/i18n'

defineProps<{
  open: boolean
  productTypes: CatalogCategoryOption[]
  selectedTypes: number[]
  inStockOnly: boolean
}>()

defineEmits<{
  close: []
  clear: []
  apply: []
  'toggle-type': [typeId: number]
  'set-in-stock-only': [value: boolean]
}>()

const { t } = useI18n()
</script>

<style scoped>
.overlay{
  position: fixed;
  inset: 0;
  background: rgba(17,17,17,.45);
  z-index: 60;
  display: flex;
}
.drawer{
  width: min(92vw, 360px);
  height: 100%;
  background: #fff;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
}
.top{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px;
  border-bottom: 1px solid var(--border);
}
.topLeft{
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.sliders{
  width: 18px;
  height: 18px;
  position: relative;
  background:
    radial-gradient(circle at 6px 6px, #111827 0 3px, transparent 3px),
    radial-gradient(circle at 12px 13px, #111827 0 3px, transparent 3px);
}
.sliders::before,
.sliders::after{
  content:"";
  position:absolute;
  left:0;
  right:0;
  height:2px;
  background: #111827;
  border-radius: 999px;
}
.sliders::before{ top:5px; }
.sliders::after{ top:12px; }
.topTitle{
  font-weight: 800;
  letter-spacing: .08em;
}
.closeBtn{
  width: 40px;
  height: 40px;
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.x{
  width: 14px;
  height: 14px;
  position: relative;
}
.x::before,
.x::after{
  content:"";
  position:absolute;
  left: 6px;
  top: 0;
  width: 2px;
  height: 14px;
  background: #111827;
  border-radius: 999px;
}
.x::before{ transform: rotate(45deg); }
.x::after{ transform: rotate(-45deg); }

.pillRow{
  padding: 12px 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border);
}
.pill{
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 999px;
  padding: 10px 12px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 12px;
}
.xMini{
  width: 10px;
  height: 10px;
  position: relative;
}
.xMini::before,
.xMini::after{
  content:"";
  position:absolute;
  left: 4px;
  top: 0;
  width: 2px;
  height: 10px;
  background: #111827;
  border-radius: 999px;
}
.xMini::before{ transform: rotate(45deg); }
.xMini::after{ transform: rotate(-45deg); }

.section{
  padding: 14px 14px 6px;
}
.secTitle{
  font-size: 12px;
  letter-spacing: .10em;
  color: rgba(17,24,39,.55);
  font-weight: 800;
  margin-bottom: 10px;
}
.toggle{
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.toggle input{
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.track{
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: rgba(17,24,39,.16);
  position: relative;
  transition: background .2s ease;
}
.knob{
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 999px;
  position: absolute;
  top: 3px;
  left: 3px;
  box-shadow: 0 6px 12px rgba(0,0,0,.16);
  transition: transform .2s ease;
}
.toggle input:checked + .track{
  background: rgba(239,68,68,.7);
}
.toggle input:checked + .track .knob{
  transform: translateX(20px);
}
.toggleText{
  font-size: 13px;
  color: rgba(17,24,39,.75);
}

.checkList{
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  max-height: 52vh;
  overflow: auto;
  padding-right: 4px;
}
.checkItem{
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.checkItem input{
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.checkBox{
  width: 18px;
  height: 18px;
  border: 1px solid rgba(17,24,39,.25);
  border-radius: 4px;
  background: #fff;
  position: relative;
}
.checkItem input:checked + .checkBox{
  border-color: rgba(17,24,39,.65);
  background: rgba(17,24,39,.06);
}
.checkItem input:checked + .checkBox::after{
  content:"";
  position:absolute;
  left: 5px;
  top: 2px;
  width: 5px;
  height: 10px;
  border-right: 2px solid rgba(17,24,39,.85);
  border-bottom: 2px solid rgba(17,24,39,.85);
  transform: rotate(45deg);
}
.checkText{
  font-size: 13px;
  color: rgba(17,24,39,.85);
}

.bottom{
  margin-top: auto;
  display: flex;
  gap: 10px;
  padding: 14px;
  border-top: 1px solid var(--border);
}
.ghost{
  flex: 1;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  cursor: pointer;
  font-weight: 700;
}
.primary{
  flex: 1;
  height: 44px;
  border-radius: 12px;
  border: 0;
  background: #111827;
  color: #fff;
  cursor: pointer;
  font-weight: 800;
}
</style>
