<script setup lang="ts">
import { computed } from 'vue'
import { dayOfMonth, monthShort, weekdayShort, toMin } from '@navalha/core'
import { useBooking } from '../../lib/useBooking'
const { state, barber, dates, slots, pickDate, go } = useBooking()

const groups = computed(() => {
  const g = [
    { label: 'Manhã', items: [] as string[] },
    { label: 'Tarde', items: [] as string[] },
    { label: 'Noite', items: [] as string[] },
  ]
  for (const t of slots.value) g[toMin(t) < 720 ? 0 : toMin(t) < 1080 ? 1 : 2].items.push(t)
  return g.filter((x) => x.items.length)
})
</script>

<template>
  <h3 class="font-display text-2xl font-semibold">Escolha dia e horário</h3>
  <p class="mt-1 text-sm text-ink-soft">Horários livres de {{ barber?.name }}.</p>

  <p v-if="state.error" role="alert" class="mt-4 rounded-xl bg-oxblood/10 px-4 py-3 text-sm text-oxblood">{{ state.error }}</p>

  <p v-if="!dates.length" class="mt-8 text-ink-soft">
    Sem horários nos próximos dias para esse serviço. Tente outro barbeiro.
  </p>

  <template v-else>
    <div class="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2" role="listbox" aria-label="Dias disponíveis">
      <button
        v-for="d in dates"
        :key="d"
        role="option"
        :aria-selected="state.date === d"
        class="flex w-16 shrink-0 flex-col items-center rounded-2xl border py-3 transition hover:border-ink"
        :class="state.date === d ? 'border-ink bg-ink text-cream' : 'border-line bg-white'"
        @click="pickDate(d)"
      >
        <span class="text-xs uppercase opacity-70">{{ weekdayShort(d) }}</span>
        <span class="font-display text-2xl font-semibold">{{ dayOfMonth(d) }}</span>
        <span class="text-xs opacity-70">{{ monthShort(d) }}</span>
      </button>
    </div>

    <div v-for="g in groups" :key="g.label" class="mt-6">
      <p class="eyebrow !text-ink-soft">{{ g.label }}</p>
      <div class="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
        <button
          v-for="t in g.items"
          :key="t"
          class="rounded-xl border py-2.5 text-sm font-medium transition hover:border-ink"
          :class="state.time === t ? 'border-ink bg-ink text-cream' : 'border-line bg-white'"
          :aria-pressed="state.time === t"
          @click="state.time = t"
        >
          {{ t }}
        </button>
      </div>
    </div>
  </template>

  <div class="mt-10 flex items-center justify-between">
    <button class="btn btn-ghost" @click="go('barber')">Voltar</button>
    <button class="btn btn-primary" :disabled="!state.time" @click="go('details')">Continuar</button>
  </div>
</template>
