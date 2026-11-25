<script setup lang="ts">
import { ArrowRight, CreditCard, Clock, Scissors } from 'lucide-vue-next'
import { SHOP, formatDateShort } from '@navalha/core'
import { useBooking } from '../lib/useBooking'
import { initials } from '../lib/format'

const { nextFree, startWith } = useBooking()
</script>

<template>
  <section class="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.15fr_0.85fr] md:pt-24">
    <div>
      <p class="eyebrow">Fortaleza · desde 2014</p>
      <h1 class="mt-5 font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
        Corte afiado.<br />
        <span class="italic text-brass-deep">Hora marcada.</span>
      </h1>
      <p class="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
        {{ SHOP.tagline }} Escolha o barbeiro, veja só os horários livres e agende em um minuto.
      </p>
      <div class="mt-9 flex flex-wrap items-center gap-3">
        <button class="btn btn-primary" @click="startWith({})">
          Agendar agora <ArrowRight :size="16" />
        </button>
        <a href="#servicos" class="btn btn-ghost">Ver serviços</a>
      </div>
      <ul class="mt-12 grid max-w-md grid-cols-3 gap-4 text-sm text-ink-soft">
        <li class="flex flex-col gap-2"><Clock :size="18" class="text-brass-deep" />Agenda em tempo real</li>
        <li class="flex flex-col gap-2"><Scissors :size="18" class="text-brass-deep" />Você escolhe o barbeiro</li>
        <li class="flex flex-col gap-2"><CreditCard :size="18" class="text-brass-deep" />Pix, cartão ou no local</li>
      </ul>
    </div>

    <div class="relative mx-auto w-full max-w-sm">
      <div class="pole absolute -left-5 top-6 hidden h-[88%] w-6 rounded-full ring-1 ring-ink/20 sm:block" aria-hidden="true" />
      <div class="card relative overflow-hidden p-7 sm:ml-6">
        <p class="eyebrow">Próximo horário livre</p>
        <template v-if="nextFree">
          <p class="mt-4 font-display text-6xl font-semibold tracking-tight">{{ nextFree.time }}</p>
          <p class="mt-1 text-ink-soft">{{ formatDateShort(nextFree.date) }}</p>
          <div class="mt-6 flex items-center gap-3 border-t border-line pt-5">
            <span class="grid h-11 w-11 place-items-center rounded-full bg-ink text-sm font-semibold text-cream">
              {{ initials(nextFree.barber.name) }}
            </span>
            <div>
              <p class="text-sm font-semibold">{{ nextFree.barber.name }}</p>
              <p class="text-xs text-ink-soft">{{ nextFree.service.name }}</p>
            </div>
          </div>
          <button class="btn btn-brass mt-6 w-full" @click="startWith({ barberId: nextFree.barber.id, serviceId: nextFree.service.id })">
            Pegar esse horário
          </button>
        </template>
        <p v-else class="mt-4 text-ink-soft">Agenda cheia por enquanto. Volte em breve.</p>
      </div>
    </div>
  </section>
</template>
