/** Mensagens que o bot sabe enviar (subconjunto da Cloud API). */
export type Outgoing =
  | { type: 'text'; body: string }
  | { type: 'buttons'; body: string; buttons: { id: string; title: string }[] }
  | { type: 'list'; body: string; button: string; rows: { id: string; title: string; description?: string }[] }

export interface Incoming {
  from: string
  name?: string
  /** Texto livre digitado, ou id do botão/linha tocado. */
  text?: string
  replyId?: string
}
