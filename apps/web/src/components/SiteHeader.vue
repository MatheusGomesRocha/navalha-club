<script setup lang="ts">
import { SHOP } from '@navalha/core'
import { useBooking } from '../lib/useBooking'
const { startWith } = useBooking()
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
      <a href="#" class="flex items-center gap-2.5" aria-label="Navalha Club — início">
        <span class="pole h-7 w-3 rounded-full ring-1 ring-ink/20" aria-hidden="true" />
        <span class="font-display text-xl font-semibold tracking-tight">{{ SHOP.name }}</span>
      </a>
      <nav class="hidden items-center gap-8 text-sm font-medium text-ink-soft md:flex" aria-label="Principal">
        <a href="#servicos" class="hover:text-ink">Serviços</a>
        <a href="#equipe" class="hover:text-ink">Equipe</a>
        <a href="#contato" class="hover:text-ink">Contato</a>
      </nav>
      <button class="btn btn-primary !px-5 !py-2.5" @click="startWith({})">Agendar horário</button>
    </div>
  </header>
</template>
