<script setup lang="ts">
import { BARBERS } from '@navalha/core'
import { useBooking } from '../../lib/useBooking'
import { hoursSummary, initials } from '../../lib/format'
const { state, go, pickBarber } = useBooking()
</script>

<template>
  <h3 class="font-display text-2xl font-semibold">Com quem você quer cortar?</h3>
  <ul class="mt-6 grid gap-3 sm:grid-cols-3">
    <li v-for="b in BARBERS" :key="b.id">
      <button
        class="flex h-full w-full flex-col items-start rounded-2xl border p-5 text-left transition hover:border-ink"
        :class="state.barberId === b.id ? 'border-ink bg-cream' : 'border-line bg-white'"
        :aria-pressed="state.barberId === b.id"
        @click="pickBarber(b.id)"
      >
        <span class="grid h-12 w-12 place-items-center rounded-full bg-ink font-display font-semibold text-cream">{{ initials(b.name) }}</span>
        <span class="mt-4 font-semibold">{{ b.name }}</span>
        <span class="text-xs font-medium text-brass-deep">{{ b.role }}</span>
        <span class="mt-3 text-xs text-ink-soft">{{ hoursSummary(b) }}</span>
      </button>
    </li>
  </ul>
  <button class="btn btn-ghost mt-8" @click="go('service')">Voltar</button>
</template>
