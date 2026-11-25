export interface Draft {
  serviceId?: string
  barberId?: string
  date?: string
  time?: string
  /** deslocamento de página na lista de horários */
  timePage?: number
}

export type Stage = 'menu' | 'service' | 'barber' | 'date' | 'time' | 'payment' | 'human'

export interface Session {
  stage: Stage
  draft: Draft
  updatedAt: number
}

const TTL_MS = 30 * 60 * 1000

/** Sessões em memória com expiração. Para mais de uma instância, use Redis. */
export class SessionStore {
  private map = new Map<string, Session>()
  get(phone: string): Session {
    const s = this.map.get(phone)
    if (!s || Date.now() - s.updatedAt > TTL_MS) return { stage: 'menu', draft: {}, updatedAt: Date.now() }
    return s
  }
  set(phone: string, s: Omit<Session, 'updatedAt'>) {
    this.map.set(phone, { ...s, updatedAt: Date.now() })
  }
  clear(phone: string) { this.map.delete(phone) }
}
