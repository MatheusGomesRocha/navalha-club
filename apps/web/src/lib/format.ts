import type { Barber, Weekday } from '@navalha/core'
import { toMin, fromMin } from '@navalha/core'

const SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

/** "ter–sáb · 09h–19h" */
export function hoursSummary(barber: Barber): string {
  const days = (Object.keys(barber.hours).map(Number) as Weekday[]).sort((a, b) => a - b)
  if (!days.length) return 'Sem expediente'
  const contiguous = days.every((d, i) => i === 0 || d === days[i - 1] + 1)
  const label = contiguous && days.length > 2
    ? `${SHORT[days[0]]}–${SHORT[days.at(-1)!]}`
    : days.map((d) => SHORT[d]).join(', ')
  const all = days.flatMap((d) => barber.hours[d] ?? [])
  const start = Math.min(...all.map(([s]) => toMin(s)))
  const end = Math.max(...all.map(([, e]) => toMin(e)))
  const h = (n: number) => fromMin(n).replace(':00', 'h').replace(':', 'h')
  return `${label} · ${h(start)}–${h(end)}`
}

export const initials = (name: string) =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

export const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export const maskCard = (v: string) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

export const maskExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export const luhn = (num: string) => {
  const d = num.replace(/\D/g, '')
  if (d.length < 13) return false
  let sum = 0
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i])
    if (i % 2) { n *= 2; if (n > 9) n -= 9 }
    sum += n
  }
  return sum % 10 === 0
}
