import {
  BARBERS, SERVICES, SHOP, buildPixPayload, createBooking, formatBRL, formatDateShort, formatDuration,
  getAvailableDates, getAvailableSlots, getBarber, getService, addDays, nowParts, SlotUnavailableError,
} from '@navalha/core'
import type { PaymentMethod } from '@navalha/core'
import { config } from './config'
import type { BookingStore } from './store'
import type { SessionStore } from './sessions'
import type { Incoming, Outgoing } from './types'

const WELCOME = `Olá! Aqui é o atendimento da ${SHOP.name} ✂️\nComo posso ajudar?`
const PAGE = 8 // horários por página (a lista aceita 10 linhas; sobram 2 para "mais/voltar")

const text = (body: string): Outgoing => ({ type: 'text', body })

export const menu = (): Outgoing => ({
  type: 'buttons',
  body: WELCOME,
  buttons: [
    { id: 'menu:book', title: 'Agendar horário' },
    { id: 'menu:mine', title: 'Meus agendamentos' },
    { id: 'menu:human', title: 'Falar com atendente' },
  ],
})

export interface FlowDeps {
  store: BookingStore
  sessions: SessionStore
  now?: () => { date: string; time: string }
}

/**
 * Máquina de estados da conversa. Recebe uma mensagem, devolve as respostas.
 * Não faz I/O de rede, então é fácil de testar e de simular no terminal.
 */
export function createFlow({ store, sessions, now = () => nowParts(SHOP.timezone) }: FlowDeps) {
  const horizon = () => Array.from({ length: 14 }, (_, i) => addDays(now().date, i))
  const ctx = (barberId: string, serviceId: string) => ({
    barber: getBarber(barberId)!,
    service: getService(serviceId)!,
    services: SERVICES,
    bookings: store.all(),
    now: now(),
  })

  const askService = (): Outgoing => ({
    type: 'list',
    body: 'Qual serviço você quer?',
    button: 'Ver serviços',
    rows: SERVICES.map((s) => ({
      id: `svc:${s.id}`,
      title: s.name,
      description: `${formatBRL(s.priceCents)} · ${formatDuration(s.durationMin)}`,
    })),
  })

  const askBarber = (): Outgoing => ({
    type: 'list',
    body: 'Com qual barbeiro?',
    button: 'Ver barbeiros',
    rows: BARBERS.map((b) => ({ id: `bar:${b.id}`, title: b.name, description: b.role })),
  })

  function askDate(barberId: string, serviceId: string): Outgoing | null {
    const dates = getAvailableDates(ctx(barberId, serviceId), horizon()).slice(0, 9)
    if (!dates.length) return null
    return {
      type: 'list',
      body: 'Qual dia fica melhor?',
      button: 'Ver dias',
      rows: dates.map((d) => ({ id: `day:${d}`, title: formatDateShort(d) })),
    }
  }

  function askTime(barberId: string, serviceId: string, date: string, page: number): Outgoing {
    const all = getAvailableSlots({ ...ctx(barberId, serviceId), date })
    const slice = all.slice(page * PAGE, page * PAGE + PAGE)
    const rows: { id: string; title: string }[] = slice.map((t) => ({ id: `time:${t}`, title: t }))
    if ((page + 1) * PAGE < all.length) rows.push({ id: 'time:more', title: 'Mais horários' })
    return { type: 'list', body: `Horários livres em ${formatDateShort(date)}:`, button: 'Ver horários', rows }
  }

  const askPayment = (): Outgoing => ({
    type: 'buttons',
    body: 'Como prefere pagar?',
    buttons: [
      { id: 'pay:pix', title: 'Pix' },
      { id: 'pay:card', title: 'Cartão (link)' },
      { id: 'pay:local', title: 'Pagar no local' },
    ],
  })

  function finalize(phone: string, name: string | undefined, method: PaymentMethod): Outgoing[] {
    const s = sessions.get(phone)
    const { serviceId, barberId, date, time } = s.draft
    if (!serviceId || !barberId || !date || !time) return [text('Perdi o fio da conversa, vamos recomeçar?'), menu()]
    const service = getService(serviceId)!
    const barber = getBarber(barberId)!
    try {
      const booking = createBooking(
        {
          barberId, serviceId, date, time,
          customer: { name: name ?? 'Cliente WhatsApp', phone },
          payment: { method, status: method === 'local' ? 'pay_at_shop' : 'pending' },
        },
        { barbers: BARBERS, services: SERVICES, bookings: store.all(), now: now() },
      )
      store.add(booking)
      sessions.clear(phone)
      const out: Outgoing[] = []
      if (method === 'pix') {
        const payload = buildPixPayload({ ...SHOP.pix, amountCents: service.priceCents, txid: booking.id })
        out.push(text(`Pix de ${formatBRL(service.priceCents)}. Copie o código abaixo e cole no app do seu banco:`), text(payload))
      }
      if (method === 'card') out.push(text(`Pague com cartão por aqui: ${config.siteUrl}#agendar`))
      out.push(
        text(
          `✅ Agendado!\n\n${service.name} com ${barber.name}\n${formatDateShort(date)} às ${time}\nValor: ${formatBRL(service.priceCents)}\nCódigo: ${booking.id}\n\n${SHOP.address}`,
        ),
        menu(),
      )
      return out
    } catch (e) {
      if (e instanceof SlotUnavailableError) {
        sessions.set(phone, { stage: 'time', draft: { ...s.draft, time: undefined, timePage: 0 } })
        return [text('Esse horário acabou de ser ocupado 😕 Escolha outro:'), askTime(barberId, serviceId, date, 0)]
      }
      throw e
    }
  }

  function listMine(phone: string): Outgoing[] {
    const mine = store.byPhone(phone).filter((b) => b.date >= now().date)
    if (!mine.length) return [text('Você não tem agendamentos futuros.'), menu()]
    const lines = mine.map((b) => `• ${formatDateShort(b.date)} às ${b.time}: ${getService(b.serviceId)?.name} com ${getBarber(b.barberId)?.name} (${b.id})`)
    return [text(`Seus próximos horários:\n${lines.join('\n')}`), menu()]
  }

  return function handle(msg: Incoming): Outgoing[] {
    const { from } = msg
    const session = sessions.get(from)
    const input = msg.replyId ?? msg.text?.trim().toLowerCase() ?? ''

    // Atalhos globais
    if (['menu', 'oi', 'olá', 'ola', 'início', 'inicio', 'cancelar', '0'].includes(input)) {
      sessions.set(from, { stage: 'menu', draft: {} })
      return [menu()]
    }
    if (session.stage === 'human') {
      // Atendente humano assumiu: o bot fica quieto até o cliente digitar "menu".
      return []
    }

    // Menu principal
    if (input === 'menu:book' || (session.stage === 'menu' && /agend|hor[aá]rio|marcar/.test(input))) {
      sessions.set(from, { stage: 'service', draft: {} })
      return [askService()]
    }
    if (input === 'menu:mine') return listMine(from)
    if (input === 'menu:human') {
      sessions.set(from, { stage: 'human', draft: {} })
      return [text(`Certo! Um atendente vai te responder por aqui em instantes. Se quiser voltar ao menu, digite *menu*.`)]
    }

    // Passos do agendamento
    if (input.startsWith('svc:') && session.stage === 'service') {
      const serviceId = input.slice(4)
      if (!getService(serviceId)) return [askService()]
      sessions.set(from, { stage: 'barber', draft: { serviceId } })
      return [askBarber()]
    }
    if (input.startsWith('bar:') && session.stage === 'barber') {
      const barberId = input.slice(4)
      const serviceId = session.draft.serviceId!
      if (!getBarber(barberId)) return [askBarber()]
      const dates = askDate(barberId, serviceId)
      if (!dates) return [text('Sem horários livres nos próximos dias com esse barbeiro. Escolha outro:'), askBarber()]
      sessions.set(from, { stage: 'date', draft: { serviceId, barberId } })
      return [dates]
    }
    if (input.startsWith('day:') && session.stage === 'date') {
      const date = input.slice(4)
      const { serviceId, barberId } = session.draft
      sessions.set(from, { stage: 'time', draft: { ...session.draft, date, timePage: 0 } })
      return [askTime(barberId!, serviceId!, date, 0)]
    }
    if (input.startsWith('time:') && session.stage === 'time') {
      const { serviceId, barberId, date } = session.draft
      if (input === 'time:more') {
        const page = (session.draft.timePage ?? 0) + 1
        sessions.set(from, { stage: 'time', draft: { ...session.draft, timePage: page } })
        return [askTime(barberId!, serviceId!, date!, page)]
      }
      const time = input.slice(5)
      sessions.set(from, { stage: 'payment', draft: { ...session.draft, time } })
      return [askPayment()]
    }
    if (input.startsWith('pay:') && session.stage === 'payment') {
      const method = input.slice(4) as PaymentMethod
      if (!['pix', 'card', 'local'].includes(method)) return [askPayment()]
      return finalize(from, msg.name, method)
    }

    // Não entendi: reencaminha para a etapa atual
    const again: Record<string, () => Outgoing> = {
      menu,
      service: askService,
      barber: askBarber,
      payment: askPayment,
    }
    const resend =
      session.stage === 'date' ? askDate(session.draft.barberId!, session.draft.serviceId!)
      : session.stage === 'time' ? askTime(session.draft.barberId!, session.draft.serviceId!, session.draft.date!, session.draft.timePage ?? 0)
      : again[session.stage]?.()
    return [text('Não entendi 😅 Use os botões ou digite *menu* para recomeçar.'), ...(resend ? [resend] : [menu()])]
  }
}
