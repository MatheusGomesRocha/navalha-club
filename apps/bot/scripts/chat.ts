/**
 * Simulador de WhatsApp no terminal: roda o mesmo fluxo do bot, sem Meta nem internet.
 * Digite o número da opção (ou texto livre). "sair" encerra.
 */
import { createInterface } from 'node:readline/promises'
import { createFlow } from '../src/flow'
import { SessionStore } from '../src/sessions'
import { JsonBookingStore } from '../src/store'
import type { Outgoing } from '../src/types'

const flow = createFlow({ store: new JsonBookingStore(null), sessions: new SessionStore() })
const rl = createInterface({ input: process.stdin, output: process.stdout })
let options: { id: string; title: string }[] = []

function print(msgs: Outgoing[]) {
  options = []
  for (const m of msgs) {
    console.log(`\n\x1b[32m🤖 ${m.type === 'text' ? m.body : m.body}\x1b[0m`)
    if (m.type === 'buttons') options = m.buttons
    if (m.type === 'list') options = m.rows
    options.forEach((o, i) => console.log(`   ${i + 1}) ${o.title}${'description' in o && o.description ? ` — ${o.description}` : ''}`))
  }
}

print(flow({ from: '5585988887777', name: 'Teste', text: 'oi' }))
while (true) {
  const line = (await rl.question('\n> ')).trim()
  if (line === 'sair') break
  const n = Number(line)
  const picked = Number.isInteger(n) ? options[n - 1] : undefined
  print(flow({ from: '5585988887777', name: 'Teste', ...(picked ? { replyId: picked.id } : { text: line }) }))
}
rl.close()
