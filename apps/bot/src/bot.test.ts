import { describe, expect, it } from 'vitest'
import { createHmac } from 'node:crypto'
import { createFlow } from './flow'
import { SessionStore } from './sessions'
import { JsonBookingStore } from './store'
import { extractIncoming, verifySignature } from './webhook'
import { toPayload } from './whatsapp'
import type { Incoming, Outgoing } from './types'

const NOW = { date: '2026-11-25', time: '08:00' }
const setup = () => {
  const store = new JsonBookingStore(null)
  const flow = createFlow({ store, sessions: new SessionStore(), now: () => NOW })
  const tap = (id: string) => flow({ from: '5585911112222', name: 'Ana', replyId: id })
  return { store, flow, tap }
}
const rowIds = (m: Outgoing[]) => m.flatMap((x) => (x.type === 'list' ? x.rows.map((r) => r.id) : x.type === 'buttons' ? x.buttons.map((b) => b.id) : []))

describe('fluxo de conversa', () => {
  it('agenda de ponta a ponta com pagamento no local', () => {
    const { store, flow, tap } = setup()
    expect(rowIds(flow({ from: '5585911112222', text: 'Oi' }))).toContain('menu:book')
    expect(rowIds(tap('menu:book'))).toContain('svc:corte')
    expect(rowIds(tap('svc:corte'))).toContain('bar:rafael')
    const days = rowIds(tap('bar:rafael'))
    expect(days.every((d) => d.startsWith('day:'))).toBe(true)
    const times = rowIds(tap(days[0]))
    expect(times.length).toBeGreaterThan(0)
    const slot = times.find((t) => t.startsWith('time:') && t !== 'time:more')!
    expect(rowIds(tap(slot))).toEqual(['pay:pix', 'pay:card', 'pay:local'])
    const before = store.all().length
    const done = tap('pay:local')
    expect(done.some((m) => m.type === 'text' && m.body.includes('Agendado'))).toBe(true)
    expect(store.all().length).toBe(before + 1)
    expect(store.byPhone('5585911112222')).toHaveLength(1)
  })

  it('Pix devolve código copia e cola válido', () => {
    const { tap } = setup()
    tap('menu:book'); tap('svc:barba'); const days = rowIds(tap('bar:diego'))
    const t = rowIds(tap(days[0])).find((x) => x !== 'time:more')!
    tap(t)
    const out = tap('pay:pix')
    const pix = out.find((m) => m.type === 'text' && m.body.startsWith('000201')) as Extract<Outgoing, { type: 'text' }>
    expect(pix).toBeTruthy()
  })

  it('transbordo para humano silencia o bot até "menu"', () => {
    const { flow, tap } = setup()
    tap('menu:human')
    expect(flow({ from: '5585911112222', text: 'alô?' })).toEqual([])
    expect(rowIds(flow({ from: '5585911112222', text: 'menu' }))).toContain('menu:book')
  })

  it('paginação de horários e fallback de texto desconhecido', () => {
    const { tap, flow } = setup()
    tap('menu:book'); tap('svc:sobrancelha'); const days = rowIds(tap('bar:caio'))
    const first = rowIds(tap(days[0]))
    expect(first.length).toBeLessThanOrEqual(10)
    const lost = flow({ from: '5585911112222', text: 'blablabla' } as Incoming)
    expect(lost[0].type).toBe('text')
  })

  it('não deixa dois clientes pegarem o mesmo horário', () => {
    const { store, flow } = setup()
    const run = (phone: string) => {
      const tap = (id: string) => flow({ from: phone, replyId: id })
      tap('menu:book'); tap('svc:corte'); const d = rowIds(tap('bar:rafael'))
      return { tap, d }
    }
    const a = run('5585900000001'), b = run('5585900000002')
    const dayA = a.d[0]
    const timesA = rowIds(a.tap(dayA)); const timesB = rowIds(b.tap(dayA))
    const slot = timesA.find((x) => x !== 'time:more')!
    expect(timesB).toContain(slot)
    a.tap(slot); a.tap('pay:local')
    b.tap(slot)
    const res = b.tap('pay:local')
    expect(res.some((m) => m.type === 'text' && m.body.includes('ocupado'))).toBe(true)
    expect(store.byPhone('5585900000002')).toHaveLength(0)
  })
})

describe('webhook', () => {
  it('valida assinatura HMAC', () => {
    const raw = JSON.stringify({ a: 1 })
    const sig = `sha256=${createHmac('sha256', 's3cret').update(raw).digest('hex')}`
    expect(verifySignature(raw, sig, 's3cret')).toBe(true)
    expect(verifySignature(raw, sig, 'outro')).toBe(false)
    expect(verifySignature(raw, undefined, 's3cret')).toBe(false)
  })

  it('extrai texto e respostas interativas', () => {
    const body = {
      entry: [{ changes: [{ value: {
        contacts: [{ wa_id: '5585', profile: { name: 'Ana' } }],
        messages: [
          { id: 'm1', from: '5585', type: 'text', text: { body: 'oi' } },
          { id: 'm2', from: '5585', type: 'interactive', interactive: { type: 'list_reply', list_reply: { id: 'svc:corte' } } },
          { id: 'm3', from: '5585', type: 'audio' },
        ],
      } }] }],
    }
    const m = extractIncoming(body)
    expect(m.map((x) => x.text ?? x.replyId)).toEqual(['oi', 'svc:corte', undefined])
    expect(m[0].name).toBe('Ana')
  })

  it('respeita limites de tamanho da Cloud API', () => {
    const p: any = toPayload('1', { type: 'buttons', body: 'x', buttons: [{ id: 'a', title: 'a'.repeat(40) }, { id: 'b', title: 'b' }, { id: 'c', title: 'c' }, { id: 'd', title: 'd' }] })
    expect(p.interactive.action.buttons).toHaveLength(3)
    expect(p.interactive.action.buttons[0].reply.title.length).toBeLessThanOrEqual(20)
  })
})
