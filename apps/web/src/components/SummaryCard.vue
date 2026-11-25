<script setup lang="ts">
import { computed } from 'vue'
import { formatBRL, formatDateShort, formatDuration } from '@navalha/core'
import { useBooking } from '../lib/useBooking'
const { state, service, barber } = useBooking()
const empty = computed(() => !service.value)
</script>

<template>
  <aside class="rounded-3xl bg-ink p-7 text-cream" aria-label="Resumo do agendamento">
    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brass">Resumo</p>
    <p v-if="empty" class="mt-4 text-sm text-cream/60">Escolha um serviço para começar.</p>
    <dl v-else class="mt-5 space-y-4 text-sm">
      <div>
        <dt class="text-cream/50">Serviço</dt>
        <dd class="font-medium">{{ service!.name }} · {{ formatDuration(service!.durationMin) }}</dd>
      </div>
      <div v-if="barber">
        <dt class="text-cream/50">Barbeiro</dt>
        <dd class="font-medium">{{ barber.name }}</dd>
      </div>
      <div v-if="state.date && state.time">
        <dt class="text-cream/50">Quando</dt>
        <dd class="font-medium">{{ formatDateShort(state.date) }} às {{ state.time }}</dd>
      </div>
      <div class="flex items-end justify-between border-t border-cream/15 pt-4">
        <dt class="text-cream/50">Total</dt>
        <dd class="font-display text-3xl font-semibold">{{ formatBRL(service!.priceCents) }}</dd>
      </div>
    </dl>
  </aside>
</template>
