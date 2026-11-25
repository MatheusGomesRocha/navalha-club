import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Incoming } from './types'

/** Valida X-Hub-Signature-256 (HMAC-SHA256 do corpo bruto com o App Secret). */
export function verifySignature(raw: Buffer | string, header: string | undefined, secret: string): boolean {
  if (!header?.startsWith('sha256=')) return false
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  const got = header.slice(7)
  return got.length === expected.length && timingSafeEqual(Buffer.from(got), Buffer.from(expected))
}

export interface InboundMessage extends Incoming {
  id: string
}

/** Extrai mensagens do payload do webhook da Cloud API. */
export function extractIncoming(body: any): InboundMessage[] {
  const out: InboundMessage[] = []
  for (const entry of body?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {}
      const names = new Map<string, string>(
        (value.contacts ?? []).map((c: any) => [c.wa_id, c.profile?.name] as [string, string]),
      )
      for (const m of value.messages ?? []) {
        const inbound: InboundMessage = { id: m.id, from: m.from, name: names.get(m.from) }
        if (m.type === 'text') inbound.text = m.text?.body
        else if (m.type === 'interactive') {
          inbound.replyId = m.interactive?.button_reply?.id ?? m.interactive?.list_reply?.id
        }
        out.push(inbound)
      }
    }
  }
  return out
}
