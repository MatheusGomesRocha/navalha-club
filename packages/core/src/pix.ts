/**
 * Gerador de "Pix copia e cola" (BR Code estático, padrão EMV do Banco Central).
 * Em produção o payload vem do PSP (cobrança dinâmica); aqui serve para demonstração.
 */
const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`

const ascii = (s: string, max: number) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().slice(0, max)

export function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface PixInput {
  key: string
  name: string
  city: string
  amountCents: number
  txid?: string
}

export function buildPixPayload({ key, name, city, amountCents, txid = '***' }: PixInput): string {
  const body =
    field('00', '01') +
    field('26', field('00', 'br.gov.bcb.pix') + field('01', key)) +
    field('52', '0000') +
    field('53', '986') +
    field('54', (amountCents / 100).toFixed(2)) +
    field('58', 'BR') +
    field('59', ascii(name, 25)) +
    field('60', ascii(city, 15)) +
    field('62', field('05', txid === '***' ? txid : txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25)))
  const withCrcId = `${body}6304`
  return withCrcId + crc16(withCrcId)
}
