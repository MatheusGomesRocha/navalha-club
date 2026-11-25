import { computed, reactive, ref } from 'vue'
import {
  BARBERS, SERVICES, SHOP, SlotUnavailableError, addDays, createBooking, generateDemoBookings,
  getAvailableDates, getAvailableSlots, getBarber, getService, nowParts,
} from '@navalha/core'
import type { Booking, PaymentMethod } from '@navalha/core'

export type Step = 'service' | 'barber' | 'datetime' | 'details' | 'payment' | 'done'
export const STEPS: { id: Step; label: string }[] = [
  { id: 'service', label: 'Serviço' },
  { id: 'barber', label: 'Barbeiro' },
  { id: 'datetime', label: 'Horário' },
  { id: 'details', label: 'Seus dados' },
  { id: 'payment', label: 'Pagamento' },
]

const STORAGE_KEY = 'navalha:bookings:v1'
const loadUser = (): Booking[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
const saveUser = (b: Booking[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)) } catch { /* modo privado */ }
}

const now = ref(nowParts(SHOP.timezone))
setInterval(() => (now.value = nowParts(SHOP.timezone)), 60_000)

const userBookings = ref<Booking[]>(loadUser())
const demoBookings = computed(() => generateDemoBookings(now.value.date))
const bookings = computed(() => [...demoBookings.value, ...userBookings.value])

const state = reactive({
  step: 'service' as Step,
  serviceId: '' as string,
  barberId: '' as string,
  date: '' as string,
  time: '' as string,
  name: '',
  phone: '',
  email: '',
  method: 'pix' as PaymentMethod,
  error: '',
  done: null as Booking | null,
})

const service = computed(() => (state.serviceId ? getService(state.serviceId) : undefined))
const barber = computed(() => (state.barberId ? getBarber(state.barberId) : undefined))

const horizon = computed(() => Array.from({ length: 21 }, (_, i) => addDays(now.value.date, i)))

const slotQuery = (barberId: string, serviceId: string) => ({
  barber: getBarber(barberId)!,
  service: getService(serviceId)!,
  services: SERVICES,
  bookings: bookings.value,
  now: now.value,
})

const dates = computed(() =>
  barber.value && service.value
    ? getAvailableDates(slotQuery(barber.value.id, service.value.id), horizon.value).slice(0, 12)
    : [],
)
const slots = computed(() =>
  barber.value && service.value && state.date
    ? getAvailableSlots({ ...slotQuery(barber.value.id, service.value.id), date: state.date })
    : [],
)

/** Primeiro horário livre entre todos os barbeiros (para o hero). */
const nextFree = computed(() => {
  const s = SERVICES[0]
  for (const date of horizon.value) {
    for (const b of BARBERS) {
      const first = getAvailableSlots({ ...slotQuery(b.id, s.id), date })[0]
      if (first) return { barber: b, date, time: first, service: s }
    }
  }
  return null
})

function go(step: Step) {
  state.error = ''
  state.step = step
  document.getElementById('agendar')?.scrollIntoView({ block: 'start' })
}

function pickService(id: string) {
  state.serviceId = id
  state.time = ''
  state.date = ''
  if (state.barberId) { state.date = dates.value[0] ?? ''; go('datetime') } else go('barber')
}
function pickBarber(id: string) {
  state.barberId = id
  state.time = ''
  state.date = dates.value[0] ?? ''
  go('datetime')
}
function pickDate(d: string) {
  state.date = d
  state.time = ''
}

function confirm(payment: Booking['payment']) {
  if (!service.value || !barber.value) return
  try {
    const booking = createBooking(
      {
        barberId: barber.value.id,
        serviceId: service.value.id,
        date: state.date,
        time: state.time,
        customer: { name: state.name.trim(), phone: state.phone, email: state.email.trim() || undefined },
        payment,
      },
      { barbers: BARBERS, services: SERVICES, bookings: bookings.value, now: now.value },
    )
    userBookings.value = [...userBookings.value, booking]
    saveUser(userBookings.value)
    state.done = booking
    go('done')
  } catch (e) {
    if (e instanceof SlotUnavailableError) {
      state.time = ''
      state.error = e.message
      go('datetime')
    } else throw e
  }
}

function reset() {
  Object.assign(state, { step: 'service', serviceId: '', barberId: '', date: '', time: '', method: 'pix', error: '', done: null })
}

/** Atalhos vindos das seções "Serviços" e "Equipe". */
function startWith(opts: { serviceId?: string; barberId?: string }) {
  reset()
  if (opts.serviceId) state.serviceId = opts.serviceId
  if (opts.barberId) state.barberId = opts.barberId
  if (state.serviceId && state.barberId) { state.date = dates.value[0] ?? ''; go('datetime') }
  else if (state.serviceId) go('barber')
  else go('service')
}

export function useBooking() {
  return { state, service, barber, dates, slots, nextFree, now, go, pickService, pickBarber, pickDate, confirm, reset, startWith }
}
