import type { NowParts, Weekday } from './types'

export const toMin = (t: string): number => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export const fromMin = (n: number): string =>
  `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`

const parse = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export const weekdayOf = (date: string): Weekday => parse(date).getUTCDay() as Weekday

export const addDays = (date: string, n: number): string => {
  const d = parse(date)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const WEEKDAYS_PT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export const weekdayName = (date: string) => WEEKDAYS_PT[weekdayOf(date)]
export const weekdayShort = (date: string) => WEEKDAYS_SHORT[weekdayOf(date)]
export const monthShort = (date: string) => MONTHS_SHORT[parse(date).getUTCMonth()]
export const dayOfMonth = (date: string) => parse(date).getUTCDate()

/** "ter, 25 nov" */
export const formatDateShort = (date: string) =>
  `${weekdayShort(date)}, ${dayOfMonth(date)} ${monthShort(date)}`

/** Data/hora "agora" no fuso informado (padrão: Fortaleza). */
export function nowParts(timeZone = 'America/Fortaleza', at: Date = new Date()): NowParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at)
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` }
}

export const formatBRL = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

export const formatDuration = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') : ''}` : `${min} min`
