import { config } from './config'
import type { Outgoing } from './types'

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

/** Converte para o payload da Cloud API respeitando os limites do WhatsApp. */
export function toPayload(to: string, m: Outgoing) {
  const base = { messaging_product: 'whatsapp', to }
  if (m.type === 'text') return { ...base, type: 'text', text: { body: cut(m.body, 4096) } }
  if (m.type === 'buttons') {
    return {
      ...base,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: cut(m.body, 1024) },
        action: {
          buttons: m.buttons.slice(0, 3).map((b) => ({ type: 'reply', reply: { id: b.id, title: cut(b.title, 20) } })),
        },
      },
    }
  }
  return {
    ...base,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: cut(m.body, 1024) },
      action: {
        button: cut(m.button, 20),
        sections: [
          {
            title: 'Opções',
            rows: m.rows.slice(0, 10).map((r) => ({
              id: r.id,
              title: cut(r.title, 24),
              ...(r.description ? { description: cut(r.description, 72) } : {}),
            })),
          },
        ],
      },
    },
  }
}

async function graph(body: unknown) {
  const res = await fetch(`https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`)
}

export async function send(to: string, messages: Outgoing[]) {
  for (const m of messages) {
    const payload = toPayload(to, m)
    if (config.dryRun) {
      console.log(`[dry-run → ${to}]`, JSON.stringify(payload))
      continue
    }
    await graph(payload) // em sequência, para manter a ordem das mensagens
  }
}

export async function markRead(messageId: string) {
  if (config.dryRun) return
  await graph({ messaging_product: 'whatsapp', status: 'read', message_id: messageId }).catch(() => {})
}
