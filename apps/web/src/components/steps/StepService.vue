<script setup lang="ts">
import { SERVICES, formatBRL, formatDuration } from '@navalha/core'
import { useBooking } from '../../lib/useBooking'
const { state, pickService } = useBooking()
</script>

<template>
  <h3 class="font-display text-2xl font-semibold">O que vamos fazer hoje?</h3>
  <ul class="mt-6 grid gap-3">
    <li v-for="s in SERVICES" :key="s.id">
      <button
        class="flex w-full items-center justify-between gap-4 rounded-2xl border p-5 text-left transition hover:border-ink"
        :class="state.serviceId === s.id ? 'border-ink bg-cream' : 'border-line bg-white'"
        :aria-pressed="state.serviceId === s.id"
        @click="pickService(s.id)"
      >
        <span>
          <span class="block font-semibold">{{ s.name }}</span>
          <span class="block text-sm text-ink-soft">{{ s.description }}</span>
        </span>
        <span class="shrink-0 text-right">
          <span class="block font-semibold">{{ formatBRL(s.priceCents) }}</span>
          <span class="block text-xs text-ink-soft">{{ formatDuration(s.durationMin) }}</span>
        </span>
      </button>
    </li>
  </ul>
</template>
