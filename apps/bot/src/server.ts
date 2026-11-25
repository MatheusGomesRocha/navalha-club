import Fastify from 'fastify'
import { fileURLToPath } from 'node:url'
import { config } from './config'
import { createFlow } from './flow'
import { SessionStore } from './sessions'
import { JsonBookingStore } from './store'
import { markRead, send } from './whatsapp'
import { extractIncoming, verifySignature } from './webhook'
import { OptionMemory, extractTwilio, renderForSms, toTwiml, verifyTwilioSignature } from './twilio'

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

  const incoming = extractIncoming(req.body)
  const kinds = ((req.body as any)?.entry ?? []).flatMap((e: any) => (e.changes ?? []).map((c: any) => c.field + ':' + Object.keys(c.value ?? {}).join('/')))
  req.log.info({ kinds, mensagens: incoming.map((m) => ({ id: m.id.slice(-8), from: m.from, text: m.text, replyId: m.replyId })) }, 'webhook recebido')
  const statuses = ((req.body as any)?.entry ?? []).flatMap((e: any) => (e.changes ?? []).flatMap((c: any) => c.value?.statuses ?? []))
  if (statuses.length) req.log.info({ statuses: statuses.map((st: any) => ({ status: st.status, to: st.recipient_id, errors: st.errors })) }, 'status de entrega')
  for (const m of incoming) {
    if (seen.has(m.id)) continue
    seen.add(m.id)
    if (seen.size > 5000) seen.delete(seen.values().next().value as string)
    void markRead(m.id)
    try {
      const out = flow(m)
      req.log.info({ respostas: out.length, tipos: out.map((o) => o.type) }, 'enviando')
      const sent = await send(m.from, out)
      req.log.info({ sent }, 'retorno da API')
      req.log.info('resposta enviada')
    } catch (err) {
      req.log.error({ err }, 'falha ao responder')
    }
  }
})

// ── Canal Twilio Sandbox (só para testes; a Meta continua em /webhook) ──────────
app.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_req, body, done) => {
  done(null, Object.fromEntries(new URLSearchParams(body as string)))
})
const memory = new OptionMemory()
const twilioSeen = new Set<string>()

app.post('/twilio', async (req, reply) => {
  const params = (req.body ?? {}) as Record<string, string>
  if (config.twilioAuthToken) {
    const url = config.twilioWebhookUrl || `https://${req.headers.host}/twilio`
    if (!verifyTwilioSignature(url, params, req.headers['x-twilio-signature'] as string, config.twilioAuthToken)) {
      return reply.code(403).send('invalid signature')
    }
  }
  const m = extractTwilio(params)
  reply.type('text/xml')
  if (!m || twilioSeen.has(m.id)) return toTwiml([])
  twilioSeen.add(m.id)
  const replyId = memory.resolve(m.from, m.text)
  req.log.info({ from: m.from, text: m.text, replyId }, 'twilio recebido')
  const out = flow({ from: m.from, name: m.name, text: m.text, replyId })
  const rendered = out.map(renderForSms)
  // vale a última pergunta que ofereceu opções
  const last = [...rendered].reverse().find((r) => r.options.length)
  if (last) memory.set(m.from, last.options)
  return toTwiml(rendered.map((r) => r.body))
})

app.listen({ port: config.port, host: '0.0.0.0' }).then(() => {
  if (config.dryRun) app.log.warn('Sem credenciais: modo dry-run (respostas só aparecem no log).')
})
