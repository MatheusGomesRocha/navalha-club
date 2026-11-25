<script setup lang="ts">
import { BARBERS } from '@navalha/core'
import { useBooking } from '../lib/useBooking'
import { hoursSummary, initials } from '../lib/format'
const { startWith } = useBooking()
const tones: Record<string, string> = {
  rafael: 'bg-ink text-cream',
  diego: 'bg-brass text-ink',
  caio: 'bg-oxblood text-cream',
}
</script>

<template>
  <section id="equipe" class="mx-auto max-w-6xl px-5 py-20">
    <p class="eyebrow">Equipe</p>
    <h2 class="mt-4 max-w-lg font-display text-4xl font-semibold leading-tight tracking-tight">
      Cada barbeiro com a sua agenda.
    </h2>
    <div class="mt-12 grid gap-6 md:grid-cols-3">
      <article v-for="b in BARBERS" :key="b.id" class="card flex flex-col p-7">
        <span class="grid h-16 w-16 place-items-center rounded-full font-display text-xl font-semibold" :class="tones[b.id]">
          {{ initials(b.name) }}
        </span>
        <h3 class="mt-6 font-display text-2xl font-semibold">{{ b.name }}</h3>
        <p class="text-sm font-medium text-brass-deep">{{ b.role }}</p>
        <p class="mt-3 text-sm leading-relaxed text-ink-soft">{{ b.bio }}</p>
        <ul class="mt-4 flex flex-wrap gap-2">
          <li v-for="t in b.specialties" :key="t" class="rounded-full border border-line px-3 py-1 text-xs text-ink-soft">{{ t }}</li>
        </ul>
        <p class="mt-auto pt-6 text-xs text-ink-soft">{{ hoursSummary(b) }}</p>
        <button class="btn btn-ghost mt-4" @click="startWith({ barberId: b.id })">
          Agendar com {{ b.name.split(' ')[0] }}
        </button>
      </article>
    </div>
  </section>
</template>
