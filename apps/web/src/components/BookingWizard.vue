<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import { STEPS, useBooking } from '../lib/useBooking'
import type { Step } from '../lib/useBooking'
import SummaryCard from './SummaryCard.vue'
import StepService from './steps/StepService.vue'
import StepBarber from './steps/StepBarber.vue'
import StepDateTime from './steps/StepDateTime.vue'
import StepDetails from './steps/StepDetails.vue'
import StepPayment from './steps/StepPayment.vue'
import StepDone from './steps/StepDone.vue'

const { state, go } = useBooking()
const index = computed(() => STEPS.findIndex((s) => s.id === state.step))
const reached = (id: Step) => {
  const i = STEPS.findIndex((s) => s.id === id)
  return i < index.value
}
</script>

<template>
  <section id="agendar" class="border-t border-line bg-paper">
    <div class="mx-auto max-w-6xl px-5 py-20">
      <p class="eyebrow">Agendamento</p>
      <h2 class="mt-4 font-display text-4xl font-semibold tracking-tight">Reserve seu horário</h2>

      <ol v-if="state.step !== 'done'" class="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm" aria-label="Etapas do agendamento">
        <li v-for="(s, i) in STEPS" :key="s.id">
          <button
            class="flex items-center gap-2 font-medium disabled:cursor-default"
            :class="i <= index ? 'text-ink' : 'text-ink-soft/50'"
            :disabled="!reached(s.id)"
            :aria-current="s.id === state.step ? 'step' : undefined"
            @click="go(s.id)"
          >
            <span
              class="grid h-6 w-6 place-items-center rounded-full border text-xs"
              :class="i < index ? 'border-ink bg-ink text-cream' : i === index ? 'border-ink' : 'border-line'"
            >
              <Check v-if="i < index" :size="13" /><template v-else>{{ i + 1 }}</template>
            </span>
            {{ s.label }}
          </button>
        </li>
      </ol>

      <div class="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div class="card min-h-[420px] p-6 sm:p-9" aria-live="polite">
          <StepService v-if="state.step === 'service'" />
          <StepBarber v-else-if="state.step === 'barber'" />
          <StepDateTime v-else-if="state.step === 'datetime'" />
          <StepDetails v-else-if="state.step === 'details'" />
          <StepPayment v-else-if="state.step === 'payment'" />
          <StepDone v-else />
        </div>
        <SummaryCard v-if="state.step !== 'done'" class="lg:sticky lg:top-24" />
      </div>
    </div>
  </section>
</template>
