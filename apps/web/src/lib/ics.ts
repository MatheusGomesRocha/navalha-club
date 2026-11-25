import type { Booking, Service } from '@navalha/core'
import { SHOP, fromMin, toMin } from '@navalha/core'

const stamp = (date: string, time: string) => `${date.replaceAll('-', '')}T${time.replace(':', '')}00`

export function downloadIcs(b: Booking, service: Service, barberName: string) {
  const end = fromMin(toMin(b.time) + service.durationMin)
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Navalha Club//Agendamento//PT',
    'BEGIN:VEVENT',
    `UID:${b.id}@navalhaclub`,
    `DTSTAMP:${stamp(b.createdAt.slice(0, 10) || b.date, '0000')}`,
    `DTSTART:${stamp(b.date, b.time)}`,
    `DTEND:${stamp(b.date, end)}`,
    `SUMMARY:${service.name} · ${SHOP.name}`,
    `DESCRIPTION:Com ${barberName}. Código ${b.id}.`,
    `LOCATION:${SHOP.address}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `agendamento-${b.id}.ics` })
  a.click()
  URL.revokeObjectURL(url)
}
