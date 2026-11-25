<script setup lang="ts">
import { computed } from 'vue'
import { CalendarPlus, CheckCircle2, MessageCircle } from 'lucide-vue-next'
import { SHOP, formatBRL, formatDateShort, getBarber, getService } from '@navalha/core'
import { useBooking } from '../../lib/useBooking'
import { downloadIcs } from '../../lib/ics'

const { state, reset } = useBooking()
const b = computed(() => state.done!)
const service = computed(() => getService(b.value.serviceId)!)
const barber = computed(() => getBarber(b.value.barberId)!)
const pay = computed(() =>
  b.value.payment.method === 'local' ? 'Pagamento na barbearia'
  : b.value.payment.method === 'pix' ? 'Pago via Pix'
  : `Pago no cartão final ${b.value.payment.cardLast4}`,
)
const wa = computed(() => {
  const msg = `Olá! Agendei ${service.value.name} com ${barber.value.name} em ${formatDateShort(b.value.date)} às ${b.value.time}. Código ${b.value.id}.`
  return `https://wa.me/${SHOP.phone}?text=${encodeURIComponent(msg)}`
})
</script>

<template>
  <div class="text-center">
    <CheckCircle2 :size="44" class="mx-auto text-ok" />
    <h3 class="mt-4 font-display text-3xl font-semibold">Horário confirmado</h3>
    <p class="mt-2 text-ink-soft">Te esperamos, {{ b.customer.name.split(' ')[0] }}.</p>
  </div>

  <dl class="mx-auto mt-8 max-w-sm divide-y divide-line text-sm">
    <div class="flex justify-between py-3"><dt class="text-ink-soft">Código</dt><dd class="font-mono font-semibold">{{ b.id }}</dd></div>
    <div class="flex justify-between py-3"><dt class="text-ink-soft">Serviço</dt><dd class="font-medium">{{ service.name }}</dd></div>
    <div class="flex justify-between py-3"><dt class="text-ink-soft">Barbeiro</dt><dd class="font-medium">{{ barber.name }}</dd></div>
    <div class="flex justify-between py-3"><dt class="text-ink-soft">Quando</dt><dd class="font-medium">{{ formatDateShort(b.date) }} · {{ b.time }}</dd></div>
    <div class="flex justify-between py-3"><dt class="text-ink-soft">Valor</dt><dd class="font-medium">{{ formatBRL(service.priceCents) }}</dd></div>
    <div class="flex justify-between py-3"><dt class="text-ink-soft">Pagamento</dt><dd class="font-medium">{{ pay }}</dd></div>
  </dl>

  <div class="mt-8 flex flex-wrap justify-center gap-3">
    <button class="btn btn-primary" @click="downloadIcs(b, service, barber.name)"><CalendarPlus :size="16" /> Adicionar ao calendário</button>
    <a :href="wa" target="_blank" rel="noopener" class="btn btn-ghost"><MessageCircle :size="16" /> Falar no WhatsApp</a>
    <button class="btn btn-ghost" @click="reset">Novo agendamento</button>
  </div>
</template>
