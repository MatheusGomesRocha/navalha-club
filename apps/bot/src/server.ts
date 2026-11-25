import Fastify from 'fastify'
import { fileURLToPath } from 'node:url'
import { config } from './config'
import { createFlow } from './flow'
import { SessionStore } from './sessions'
import { JsonBookingStore } from './store'
import { markRead, send } from './whatsapp'
import { extractIncoming, verifySignature } from './webhook'

const app = Fastify({ logger: true })
const flow = createFlow({
  store: new JsonBookingStore(fileURLToPath(new URL('../data/bookings.json', import.meta.url))),
  sessions: new SessionStore(),
})

// Guarda o corpo bruto: a assinatura da Meta é calculada sobre ele.
app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
  ;(req as any).rawBody = body
  try { done(null, JSON.parse(body.toString() || '{}')) } catch (e) { done(e as Error) }
})

app.get('/health', async () => ({ ok: true, dryRun: config.dryRun }))

// Verificação do webhook (a Meta chama uma vez ao cadastrar a URL)
app.get('/webhook', async (req, reply) => {
  const q = req.query as Record<string, string>
  if (q['hub.mode'] === 'subscribe' && config.verifyToken && q['hub.verify_token'] === config.verifyToken) {
    return reply.type('text/plain').send(q['hub.challenge'])
  }
  return reply.code(403).send('forbidden')
})

const seen = new Set<string>() // a Meta reenvia o webhook se demorarmos: deduplica por id

app.post('/webhook', async (req, reply) => {
  if (config.appSecret && !verifySignature((req as any).rawBody, req.headers['x-hub-signature-256'] as string, config.appSecret)) {
    return reply.code(401).send('invalid signature')
  }
  reply.code(200).send('ok') // responde rápido; processa depois

  for (const m of extractIncoming(req.body)) {
    if (seen.has(m.id)) continue
    seen.add(m.id)
    if (seen.size > 5000) seen.delete(seen.values().next().value as string)
    void markRead(m.id)
    try {
      await send(m.from, flow(m))
    } catch (err) {
      req.log.error({ err }, 'falha ao responder')
    }
  }
})

app.listen({ port: config.port, host: '0.0.0.0' }).then(() => {
  if (config.dryRun) app.log.warn('Sem credenciais: modo dry-run (respostas só aparecem no log).')
})
