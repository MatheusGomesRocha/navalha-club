import { getService } from './data'
import type { Barber, Booking, NowParts, Service } from './types'
import { fromMin, toMin, weekdayOf } from './time'

export const SLOT_STEP_MIN = 30
export const LEAD_TIME_MIN = 30

const durationOf = (b: Booking, services: Service[]) =>
  (services.find((s) => s.id === b.serviceId) ?? getService(b.serviceId))?.durationMin ?? 30

export interface SlotQuery {
  barber: Barber
  service: Service
  date: string
  bookings: Booking[]
  services: Service[]
  now: NowParts
  leadTimeMin?: number
}

/**
 * Horários livres (HH:mm) de um barbeiro numa data, para um serviço.
 * Respeita o expediente, a duração do serviço, agendamentos existentes e
 * a antecedência mínima quando a data é hoje.
 */
export function getAvailableSlots(q: SlotQuery): string[] {
  const { barber, service, date, bookings, services, now } = q
  if (date < now.date) return []

  const ranges = barber.hours[weekdayOf(date)] ?? []
  const taken = bookings
    .filter((b) => b.barberId === barber.id && b.date === date && b.status !== 'cancelled')
    .map((b) => ({ start: toMin(b.time), end: toMin(b.time) + durationOf(b, services) }))

  const earliest = date === now.date ? toMin(now.time) + (q.leadTimeMin ?? LEAD_TIME_MIN) : 0
  const slots: string[] = []

  for (const [from, to] of ranges) {
    for (let t = toMin(from); t + service.durationMin <= toMin(to); t += SLOT_STEP_MIN) {
      if (t < earliest) continue
      const end = t + service.durationMin
      if (taken.some((x) => t < x.end && x.start < end)) continue
      slots.push(fromMin(t))
    }
  }
  return slots
}

/** Próximos dias (a partir de hoje) em que o barbeiro tem ao menos um horário. */
export function getAvailableDates(
  q: Omit<SlotQuery, 'date'>,
  days: string[],
): string[] {
  return days.filter((date) => getAvailableSlots({ ...q, date }).length > 0)
}

export class SlotUnavailableError extends Error {
  constructor() {
    super('Esse horário acabou de ser ocupado. Escolha outro, por favor.')
  }
}

export interface NewBooking {
  barberId: string
  serviceId: string
  date: string
  time: string
  customer: Booking['customer']
  payment: Booking['payment']
}

let counter = 0
export const makeBookingId = () =>
  `NC-${Date.now().toString(36).toUpperCase().slice(-4)}${(counter++ % 36).toString(36).toUpperCase()}${Math.floor(Math.random() * 36).toString(36).toUpperCase()}`

/** Cria o agendamento revalidando a disponibilidade (evita corrida entre abas/canais). */
export function createBooking(
  input: NewBooking,
  ctx: { barbers: Barber[]; services: Service[]; bookings: Booking[]; now: NowParts },
): Booking {
  const barber = ctx.barbers.find((b) => b.id === input.barberId)
  const service = ctx.services.find((s) => s.id === input.serviceId)
  if (!barber || !service) throw new Error('Barbeiro ou serviço inválido')

  const free = getAvailableSlots({
    barber, service, date: input.date, bookings: ctx.bookings, services: ctx.services, now: ctx.now,
  })
  if (!free.includes(input.time)) throw new SlotUnavailableError()

  return { ...input, id: makeBookingId(), status: 'confirmed', createdAt: new Date().toISOString() }
}
