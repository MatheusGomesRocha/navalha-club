<script setup lang="ts">
import { MapPin, Phone, Instagram } from 'lucide-vue-next'
import { SHOP } from '@navalha/core'
</script>

<template>
  <footer id="contato" class="bg-ink text-cream">
    <div class="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_1fr_1fr]">
      <div>
        <p class="font-display text-3xl font-semibold">{{ SHOP.name }}</p>
        <p class="mt-3 max-w-xs text-sm text-cream/70">{{ SHOP.tagline }}</p>
      </div>
      <ul class="space-y-3 text-sm text-cream/80">
        <li class="flex gap-3"><MapPin :size="16" class="mt-0.5 shrink-0 text-brass" />{{ SHOP.address }}</li>
        <li class="flex gap-3"><Phone :size="16" class="shrink-0 text-brass" />
          <a :href="`https://wa.me/${SHOP.phone}`" class="hover:text-cream">{{ SHOP.phoneLabel }} · WhatsApp</a>
        </li>
        <li class="flex gap-3"><Instagram :size="16" class="shrink-0 text-brass" />{{ SHOP.instagram }}</li>
      </ul>
      <p class="text-sm text-cream/60">
        Projeto de demonstração: barbearia, endereço e pagamentos são fictícios.
      </p>
    </div>
  </footer>
</template>
