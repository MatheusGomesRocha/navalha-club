import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Incoming, Outgoing } from './types'

/**
 * Canal alternativo: Twilio Sandbox for WhatsApp.
 *
 * O sandbox não tem botões nem listas. Então as opções viram texto numerado e o
 * cliente responde com o número; aqui o número é traduzido de volta para o id
 * que o fluxo já entende (menu:book, svc:corte, ...). O fluxo em si não muda.
 */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export interface Rendered {
  body: string
  /** ids das opções, na ordem em que foram numeradas (1, 2, 3...). */
  options: string[]
}

export function renderForSms(m: Outgoing): Rendered {
  if (m.type === 'text') return { body: m.body, options: [] }
  if (m.type === 'buttons') {
    const lines = m.buttons.map((b, i) => `${i + 1}. ${b.title}`)
    return { body: `${m.body}\n\n${lines.join('\n')}\n\nResponda com o número da opção.`, options: m.buttons.map((b) => b.id) }
  }
  const lines = m.rows.map((r, i) => `${i + 1}. ${r.title}${r.description ? ` — ${r.description}` : ''}`)
  return { body: `${m.body}\n\n${lines.join('\n')}\n\nResponda com o número da opção.`, options: m.rows.map((r) => r.id) }
}

/** Lembra, por cliente, as opções da última pergunta para traduzir "2" em um id. */
export class OptionMemory {
  private map = new Map<string, string[]>()
  set(phone: string, ids: string[]) {
    if (ids.length) this.map.set(phone, ids)
  }
  /** Se o texto for um número válido da última lista, devolve o id correspondente. */
  resolve(phone: string, text?: string): string | undefined {
    const n = /^\s*(\d{1,2})\s*$/.exec(text ?? '')
    if (!n) return undefined
    return this.map.get(phone)?.[Number(n[1]) - 1]
  }
  clear(phone: string) {
    this.map.delete(phone)
  }
}

export interface TwilioInbound extends Incoming {
  id: string
}

/** Corpo form-urlencoded da Twilio → mensagem do bot. */
export function extractTwilio(body: Record<string, string> | undefined): TwilioInbound | null {
  if (!body?.MessageSid || !body.From) return null
  const from = body.From.replace(/^whatsapp:/, '').replace(/\D/g, '')
  return { id: body.MessageSid, from, name: body.ProfileName, text: body.Body }
}

/** Resposta em TwiML: uma <Message> por mensagem do bot (não precisa de credenciais para responder). */
export function toTwiml(parts: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${parts.map((p) => `<Message>${esc(p)}</Message>`).join('')}</Response>`
}

/** X-Twilio-Signature: HMAC-SHA1(url + parâmetros ordenados concatenados), em base64. */
export function verifyTwilioSignature(url: string, params: Record<string, string>, header: string | undefined, authToken: string): boolean {
  if (!header) return false
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join('')
  const expected = createHmac('sha1', authToken).update(data).digest('base64')
  return expected.length === header.length && timingSafeEqual(Buffer.from(expected), Buffer.from(header))
}
