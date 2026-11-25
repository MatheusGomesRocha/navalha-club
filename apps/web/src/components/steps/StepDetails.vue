<script setup lang="ts">
import { computed } from 'vue'
import { useBooking } from '../../lib/useBooking'
import { maskPhone } from '../../lib/format'
const { state, go } = useBooking()

const phoneOk = computed(() => state.phone.replace(/\D/g, '').length >= 10)
const emailOk = computed(() => !state.email || /^\S+@\S+\.\S+$/.test(state.email))
const valid = computed(() => state.name.trim().length >= 2 && phoneOk.value && emailOk.value)
</script>

<template>
  <h3 class="font-display text-2xl font-semibold">Seus dados</h3>
  <p class="mt-1 text-sm text-ink-soft">Usamos só para confirmar e lembrar do horário.</p>

  <form class="mt-6 grid gap-4" @submit.prevent="valid && go('payment')">
    <label class="grid gap-1.5 text-sm font-medium">
      Nome
      <input v-model="state.name" class="field" autocomplete="name" placeholder="Como podemos te chamar?" required />
    </label>
    <label class="grid gap-1.5 text-sm font-medium">
      WhatsApp
      <input
        :value="state.phone"
        class="field"
        inputmode="tel"
        autocomplete="tel-national"
        placeholder="(85) 99999-0000"
        required
        @input="state.phone = maskPhone(($event.target as HTMLInputElement).value)"
      />
    </label>
    <label class="grid gap-1.5 text-sm font-medium">
      E-mail <span class="font-normal text-ink-soft">(opcional)</span>
      <input v-model="state.email" class="field" type="email" autocomplete="email" placeholder="voce@email.com" />
      <span v-if="!emailOk" class="text-xs text-oxblood">Confira o e-mail.</span>
    </label>
    <div class="mt-4 flex items-center justify-between">
      <button type="button" class="btn btn-ghost" @click="go('datetime')">Voltar</button>
      <button type="submit" class="btn btn-primary" :disabled="!valid">Continuar</button>
    </div>
  </form>
</template>
