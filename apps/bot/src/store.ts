import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { generateDemoBookings, nowParts, SHOP } from '@navalha/core'
import type { Booking } from '@navalha/core'

export interface BookingStore {
  all(): Booking[]
  add(b: Booking): void
  byPhone(phone: string): Booking[]
}

/** Persistência em arquivo JSON. Troque por banco/API (ex.: o backend Laravel) em produção. */
export class JsonBookingStore implements BookingStore {
  private items: Booking[]
  constructor(private file: string | null) {
    const seed = generateDemoBookings(nowParts(SHOP.timezone).date)
    const saved: Booking[] = file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []
    this.items = [...seed, ...saved]
  }
  all() { return this.items }
  byPhone(phone: string) {
    return this.items.filter((b) => b.customer.phone === phone && b.status === 'confirmed' && !b.id.startsWith('DEMO'))
  }
  add(b: Booking) {
    this.items.push(b)
    if (!this.file) return
    mkdirSync(dirname(this.file), { recursive: true })
    writeFileSync(this.file, JSON.stringify(this.items.filter((x) => !x.id.startsWith('DEMO')), null, 2))
  }
}
