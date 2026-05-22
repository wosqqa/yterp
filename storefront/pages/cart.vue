<template>
  <div class="wrap">
    <div class="topBar">
      <NuxtLink class="back" to="/">←</NuxtLink>
      <div class="title">{{ t('cart') }}</div>
      <button v-if="lines.length" class="clear" @click="cart.clear()">{{ t('clear') }}</button>
      <span v-else />
    </div>

    <div v-if="!lines.length" class="empty">
      {{ t('cartEmpty') }}。
      <NuxtLink to="/">{{ t('shopNow') }}</NuxtLink>
    </div>

    <div v-else class="list">
      <div v-for="l in lines" :key="l.id" class="line">
        <div class="lineInfo">
          <div class="lineTitle">{{ l.title }}</div>
          <div class="linePrice">{{ money.format(l.priceCny) }}</div>
        </div>
        <div class="lineActions">
          <div class="qty">
            <button class="qtyBtn" @click="cart.setQty(l.id, l.qty - 1)">-</button>
            <input
              class="qtyInput"
              :value="l.qty"
              @input="cart.setQty(l.id, Number($event && $event.target && $event.target.value))"
            />
            <button class="qtyBtn" @click="cart.setQty(l.id, l.qty + 1)">+</button>
          </div>
          <button class="remove" @click="cart.remove(l.id)">移除</button>
        </div>
      </div>

      <div class="summary">
        <div class="sumRow">
          <span>{{ t('subtotal') }}</span>
          <span class="sumVal">{{ money.format(subtotalCny) }}</span>
        </div>
        <button class="checkout" @click="mockCheckout">{{ t('checkoutMock') }}</button>
        <div v-if="submitted" class="submitted">{{ t('orderSubmitted') }}：{{ submitted }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCart } from '../composables/cart'
import { useI18n } from '../composables/i18n'
import { useMoney } from '../composables/money'

const cart = useCart()
const lines = cart.lines
const subtotalCny = cart.subtotalCny
const submitted = ref('')
const { t } = useI18n()
const money = useMoney()

function mockCheckout() {
  submitted.value = `SO-${Math.floor(Date.now() / 1000)}`
}
</script>

<style scoped>
.wrap{
  max-width: 900px;
  margin: 0 auto;
  padding: 14px;
}
.topBar{
  display: grid;
  grid-template-columns: 44px 1fr 60px;
  align-items: center;
  gap: 10px;
  padding: 10px 0 14px;
}
.back{
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
}
.title{
  text-align: center;
  font-weight: 900;
}
.clear{
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  justify-self: end;
}
.empty{
  padding: 24px 0;
  color: rgba(17,24,39,.7);
}
.list{
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.line{
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.lineTitle{
  font-weight: 800;
  line-height: 1.25;
}
.linePrice{
  margin-top: 4px;
  color: rgba(17,24,39,.65);
  font-weight: 700;
}
.lineActions{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.qty{
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(17,17,17,.10);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}
.qtyBtn{
  width: 40px;
  height: 40px;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-weight: 900;
}
.qtyInput{
  width: 54px;
  height: 40px;
  border: 0;
  outline: none;
  text-align: center;
  font-weight: 800;
}
.remove{
  border: 0;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  font-weight: 800;
}
.summary{
  margin-top: 6px;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
}
.sumRow{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(17,17,17,.06);
  font-weight: 800;
}
.sumVal{
  color: rgba(17,24,39,.85);
}
.checkout{
  width: 100%;
  height: 46px;
  border-radius: 14px;
  border: 0;
  margin-top: 12px;
  background: #111827;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}
.submitted{
  margin-top: 10px;
  color: rgba(17,24,39,.65);
  font-size: 13px;
}

@media (min-width: 900px){
  .wrap{
    padding: 20px;
  }
  .line{
    grid-template-columns: 1fr 280px;
    align-items: center;
  }
  .lineActions{
    justify-content: flex-end;
  }
}
</style>
