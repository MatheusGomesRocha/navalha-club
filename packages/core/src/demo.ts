import { BARBERS, SERVICES } from './data'
import type { Booking } from './types'
import { addDays, fromMin, toMin, weekdayOf } from './time'

const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Agenda de demonstração: ocupa ~35% dos horários dos próximos dias,
 * de forma determinística, para a demo não parecer vazia.
 */
export function generateDemoBookings(today: string, days = 21): Booking[] {
  const out: Booking[] = []
  for (let i = 0; i < days; i++) {
    const date = addDays(today, i)
    for (const barber of BARBERS) {
      for (const [from, to] of barber.hours[weekdayOf(date)] ?? []) {
        for (let t = toMin(from); t + 30 <= toMin(to); t += 30) {
          const h = hash(`${barber.id}|${date}|${t}`)
          if (h % 100 >= 35) continue
          const service = SERVICES[h % SERVICES.length]
          // evita sobreposição com o último agendamento gerado
          const last = out.filter((b) => b.barberId === barber.id && b.date === date).at(-1)
          if (last && toMin(last.time) + (SERVICES.find((s) => s.id === last.serviceId)?.durationMin ?? 30) > t) continue
          out.push({
            id: `DEMO-${h.toString(36).toUpperCase()}`,
            barberId: barber.id,
            serviceId: service.id,
            date,
            time: fromMin(t),
            customer: { name: 'Cliente', phone: '' },
            payment: { method: 'local', status: 'pay_at_shop' },
            status: 'confirmed',
            createdAt: today,
          })
        }
      }
    }
  }
  return out
}
