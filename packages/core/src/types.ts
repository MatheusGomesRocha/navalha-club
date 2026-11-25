export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = domingo

export interface Service {
  id: string
  name: string
  description: string
  durationMin: number
  priceCents: number
}

export type TimeRange = [start: string, end: string]

export interface Barber {
  id: string
  name: string
  role: string
  bio: string
  specialties: string[]
  /** Expediente por dia da semana. Dia ausente = folga. */
  hours: Partial<Record<Weekday, TimeRange[]>>
}

export type PaymentMethod = 'pix' | 'card' | 'local'
export type PaymentStatus = 'pending' | 'paid' | 'pay_at_shop'
export type BookingStatus = 'confirmed' | 'cancelled'

export interface Customer {
  name: string
  phone: string
  email?: string
}

export interface Booking {
  id: string
  barberId: string
  serviceId: string
  /** YYYY-MM-DD */
  date: string
  /** HH:mm */
  time: string
  customer: Customer
  payment: { method: PaymentMethod; status: PaymentStatus; cardLast4?: string }
  status: BookingStatus
  createdAt: string
}

export interface NowParts {
  date: string
  time: string
}
