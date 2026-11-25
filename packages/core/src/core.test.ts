import { describe, expect, it } from 'vitest'
import {
  BARBERS, SERVICES, buildPixPayload, crc16, createBooking, getAvailableDates, getAvailableSlots,
  SlotUnavailableError, addDays, weekdayOf, generateDemoBookings,
} from './index'
import type { Booking } from './types'

const rafael = BARBERS[0]
const corte = SERVICES.find((s) => s.id === 'corte')!
const combo = SERVICES.find((s) => s.id === 'combo')!
// 2026-11-25 é quarta-feira
const base = { barber: rafael, service: corte, services: SERVICES, bookings: [] as Booking[] }
const early = { date: '2026-11-20', time: '08:00' }

const booking = (over: Partial<Booking>): Booking => ({
  id: 'x', barberId: 'rafael', serviceId: 'corte', date: '2026-11-25', time: '09:00',
  customer: { name: 'A', phone: '1' }, payment: { method: 'local', status: 'pay_at_shop' },
  status: 'confirmed', createdAt: '', ...over,
})

describe('slots', () => {
  it('respeita expediente e almoço', () => {
    const s = getAvailableSlots({ ...base, date: '2026-11-25', now: early })
    expect(s[0]).toBe('09:00')
    expect(s).not.toContain('12:00') // almoço
    expect(s).toContain('13:00')
    expect(s.at(-1)).toBe('18:00') // 45 min cabem até 19:00
  })

  it('não oferece dia de folga', () => {
    expect(weekdayOf('2026-11-23')).toBe(1) // segunda
    expect(getAvailableSlots({ ...base, date: '2026-11-23', now: early })).toEqual([])
  })

  it('bloqueia sobreposição com agendamentos', () => {
    const s = getAvailableSlots({
      ...base, date: '2026-11-25', now: early, bookings: [booking({ time: '09:00', serviceId: 'combo' })],
    })
    expect(s).not.toContain('09:00')
    expect(s).not.toContain('10:00') // combo vai até 10:15
    expect(s).toContain('10:30')
  })

  it('um serviço longo não invade o almoço', () => {
    const s = getAvailableSlots({ ...base, service: combo, date: '2026-11-25', now: early })
    expect(s).toContain('10:30') // 10:30 + 75 = 11:45
    expect(s).not.toContain('11:00')
  })

  it('aplica antecedência mínima hoje e ignora o passado', () => {
    const today = getAvailableSlots({ ...base, date: '2026-11-25', now: { date: '2026-11-25', time: '14:10' } })
    expect(today[0]).toBe('15:00')
    expect(getAvailableSlots({ ...base, date: '2026-11-24', now: { date: '2026-11-25', time: '08:00' } })).toEqual([])
  })

  it('cancelados liberam o horário', () => {
    const s = getAvailableSlots({
      ...base, date: '2026-11-25', now: early, bookings: [booking({ status: 'cancelled' })],
    })
    expect(s).toContain('09:00')
  })

  it('lista só datas com horário', () => {
    const days = Array.from({ length: 7 }, (_, i) => addDays('2026-11-22', i))
    const d = getAvailableDates({ barber: rafael, service: corte, services: SERVICES, bookings: [], now: early }, days)
    expect(d).not.toContain('2026-11-22') // domingo
    expect(d).not.toContain('2026-11-23') // segunda
    expect(d).toContain('2026-11-24')
  })
})

describe('createBooking', () => {
  const ctx = { barbers: BARBERS, services: SERVICES, bookings: [] as Booking[], now: early }
  const input = {
    barberId: 'rafael', serviceId: 'corte', date: '2026-11-25', time: '09:00',
    customer: { name: 'João', phone: '85999990000' }, payment: { method: 'pix' as const, status: 'paid' as const },
  }
  it('cria quando livre', () => {
    const b = createBooking(input, ctx)
    expect(b.status).toBe('confirmed')
    expect(b.id).toMatch(/^NC-/)
  })
  it('recusa horário ocupado', () => {
    const first = createBooking(input, ctx)
    expect(() => createBooking(input, { ...ctx, bookings: [first] })).toThrow(SlotUnavailableError)
  })
})

describe('pix', () => {
  it('CRC bate com o vetor padrão CRC16/CCITT-FALSE', () => {
    expect(crc16('123456789')).toBe('29B1')
  })
  it('payload termina com CRC válido', () => {
    const p = buildPixPayload({ key: 'a@b.co', name: 'Navalha Club', city: 'Fortaleza', amountCents: 5500, txid: 'NC123' })
    expect(p.startsWith('000201')).toBe(true)
    expect(p).toContain('540555.00')
    expect(crc16(p.slice(0, -4))).toBe(p.slice(-4))
  })
})

describe('demo', () => {
  it('gera agenda determinística sem sobreposição', () => {
    const a = generateDemoBookings('2026-11-25')
    expect(a.length).toBeGreaterThan(20)
    expect(generateDemoBookings('2026-11-25')).toEqual(a)
  })
})
