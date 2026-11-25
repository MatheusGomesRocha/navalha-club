<script setup lang="ts">
import { SERVICES, formatBRL, formatDuration } from '@navalha/core'
import { useBooking } from '../lib/useBooking'
const { startWith } = useBooking()
</script>

<template>
  <section id="servicos" class="border-y border-line bg-paper">
    <div class="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p class="eyebrow">Serviços</p>
        <h2 class="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight">
          Poucos serviços, feitos com capricho.
        </h2>
        <p class="mt-4 max-w-xs text-ink-soft">Preço fechado, sem surpresa no balcão.</p>
      </div>
      <ul class="divide-y divide-line">
        <li v-for="s in SERVICES" :key="s.id">
          <button
            class="group flex w-full items-start justify-between gap-6 py-5 text-left"
            @click="startWith({ serviceId: s.id })"
          >
            <span>
              <span class="block font-display text-xl font-semibold group-hover:text-brass-deep">{{ s.name }}</span>
              <span class="mt-1 block max-w-sm text-sm text-ink-soft">{{ s.description }}</span>
            </span>
            <span class="shrink-0 text-right">
              <span class="block font-semibold">{{ formatBRL(s.priceCents) }}</span>
              <span class="block text-xs text-ink-soft">{{ formatDuration(s.durationMin) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>
