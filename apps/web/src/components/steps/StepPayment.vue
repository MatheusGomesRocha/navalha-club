<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import QRCode from 'qrcode'
import { Banknote, Copy, CreditCard, QrCode } from 'lucide-vue-next'
import { SHOP, buildPixPayload, formatBRL } from '@navalha/core'
import type { PaymentMethod } from '@navalha/core'
import { useBooking } from '../../lib/useBooking'
import { luhn, maskCard, maskExpiry } from '../../lib/format'

const { state, service, go, confirm } = useBooking()

const options: { id: PaymentMethod; label: string; hint: string; icon: typeof QrCode }[] = [
  { id: 'pix', label: 'Pix', hint: 'Aprovação na hora', icon: QrCode },
  { id: 'card', label: 'Cartão de crédito', hint: 'Em até 1x sem juros', icon: CreditCard },
  { id: 'local', label: 'Pagar na barbearia', hint: 'Dinheiro, Pix ou cartão no balcão', icon: Banknote },
]

// Pix (demonstração: chave fictícia)
const payload = computed(() =>
  buildPixPayload({ ...SHOP.pix, amountCents: service.value!.priceCents, txid: `NC${state.date.replaceAll('-', '')}${state.time.replace(':', '')}` }),
)
const qr = ref('')
const copied = ref(false)
watch(
  [() => state.method, payload],
  async ([m]) => { if (m === 'pix') qr.value = await QRCode.toDataURL(payload.value, { margin: 1, width: 220, color: { dark: '#16120E', light: '#FFFFFF' } }) },
  { immediate: true },
)
async function copy() {
  try { await navigator.clipboard.writeText(payload.value); copied.value = true; setTimeout(() => (copied.value = false), 2000) } catch { /* sem permissão */ }
}

// Cartão (demonstração: nada é enviado nem armazenado, só os 4 últimos dígitos)
const card = ref({ number: '', name: '', expiry: '', cvv: '' })
const cardOk = computed(
  () => luhn(card.value.number) && card.value.name.trim().length > 2 && /^\d{2}\/\d{2}$/.test(card.value.expiry) && card.value.cvv.length >= 3,
)

function submit() {
  if (state.method === 'pix') confirm({ method: 'pix', status: 'paid' })
  else if (state.method === 'card') confirm({ method: 'card', status: 'paid', cardLast4: card.value.number.replace(/\D/g, '').slice(-4) })
  else confirm({ method: 'local', status: 'pay_at_shop' })
}
const cta = computed(() =>
  state.method === 'pix' ? 'Já fiz o Pix (simular)' : state.method === 'card' ? `Pagar ${formatBRL(service.value!.priceCents)}` : 'Confirmar agendamento',
)
</script>

<template>
  <h3 class="font-display text-2xl font-semibold">Como prefere pagar?</h3>

  <fieldset class="mt-6 grid gap-3">
    <legend class="sr-only">Forma de pagamento</legend>
    <label
      v-for="o in options"
      :key="o.id"
      class="flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-cream"
      :class="state.method === o.id ? 'border-ink bg-cream' : 'border-line bg-white'"
    >
      <input v-model="state.method" type="radio" name="pay" :value="o.id" class="sr-only" />
      <component :is="o.icon" :size="20" class="text-brass-deep" />
      <span>
        <span class="block text-sm font-semibold">{{ o.label }}</span>
        <span class="block text-xs text-ink-soft">{{ o.hint }}</span>
      </span>
    </label>
  </fieldset>

  <div v-if="state.method === 'pix'" class="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line p-6 sm:flex-row">
    <img v-if="qr" :src="qr" alt="QR Code do Pix" width="160" height="160" class="rounded-xl border border-line" />
    <div class="min-w-0 flex-1 text-sm">
      <p class="font-semibold">Escaneie ou copie o código</p>
      <p class="mt-1 break-all text-xs text-ink-soft">{{ payload.slice(0, 60) }}…</p>
      <button type="button" class="btn btn-ghost mt-3 !py-2" @click="copy"><Copy :size="14" /> {{ copied ? 'Copiado!' : 'Copiar Pix' }}</button>
      <p class="mt-3 text-xs text-ink-soft">Demonstração: chave fictícia, nenhum valor é cobrado.</p>
    </div>
  </div>

  <div v-else-if="state.method === 'card'" class="mt-6 grid gap-3">
    <input :value="card.number" class="field" inputmode="numeric" autocomplete="cc-number" placeholder="Número do cartão" @input="card.number = maskCard(($event.target as HTMLInputElement).value)" />
    <input v-model="card.name" class="field" autocomplete="cc-name" placeholder="Nome impresso no cartão" />
    <div class="grid grid-cols-2 gap-3">
      <input :value="card.expiry" class="field" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" @input="card.expiry = maskExpiry(($event.target as HTMLInputElement).value)" />
      <input v-model="card.cvv" class="field" inputmode="numeric" autocomplete="cc-csc" maxlength="4" placeholder="CVV" />
    </div>
    <p class="text-xs text-ink-soft">Demonstração: use 4242 4242 4242 4242. Nenhum dado de cartão sai do navegador.</p>
  </div>

  <div class="mt-10 flex items-center justify-between">
    <button class="btn btn-ghost" @click="go('details')">Voltar</button>
    <button class="btn btn-primary" :disabled="state.method === 'card' && !cardOk" @click="submit">{{ cta }}</button>
  </div>
</template>
