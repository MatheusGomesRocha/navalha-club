import type { Barber, Service } from './types'

export const SHOP = {
  name: 'Navalha Club',
  tagline: 'Barbearia de bairro, acabamento de ateliê.',
  address: 'Rua das Palmeiras, 128 · Aldeota, Fortaleza – CE',
  phone: '5585999990000',
  phoneLabel: '(85) 99999-0000',
  instagram: '@navalhaclub',
  timezone: 'America/Fortaleza',
  pix: { key: 'pagamentos@navalhaclub.demo', name: 'NAVALHA CLUB', city: 'FORTALEZA' },
} as const

export const SERVICES: Service[] = [
  { id: 'corte', name: 'Corte clássico', description: 'Tesoura e máquina, finalização com navalha no pescoço.', durationMin: 45, priceCents: 5500 },
  { id: 'degrade', name: 'Degradê', description: 'Fade preciso, do skin ao médio, com acabamento à mão.', durationMin: 50, priceCents: 6500 },
  { id: 'barba', name: 'Barba com toalha quente', description: 'Modelagem, óleo e toalha quente para relaxar.', durationMin: 30, priceCents: 4500 },
  { id: 'combo', name: 'Corte + Barba', description: 'O combo completo, sem pressa e com desconto.', durationMin: 75, priceCents: 9500 },
  { id: 'sobrancelha', name: 'Sobrancelha', description: 'Alinhamento na navalha, discreto e natural.', durationMin: 15, priceCents: 2000 },
]

const weekdays = (days: number[], ranges: [string, string][]) =>
  Object.fromEntries(days.map((d) => [d, ranges]))

export const BARBERS: Barber[] = [
  {
    id: 'rafael',
    name: 'Rafael Duarte',
    role: 'Mestre barbeiro',
    bio: '12 anos de bancada. Referência em corte clássico e navalha.',
    specialties: ['Corte clássico', 'Navalha'],
    hours: weekdays([2, 3, 4, 5, 6], [['09:00', '12:00'], ['13:00', '19:00']]),
  },
  {
    id: 'diego',
    name: 'Diego Alencar',
    role: 'Especialista em degradê',
    bio: 'Fade limpo e barba desenhada. Atende de segunda a sexta até mais tarde.',
    specialties: ['Degradê', 'Barba'],
    hours: weekdays([1, 2, 3, 4, 5], [['10:00', '13:00'], ['14:00', '20:00']]),
  },
  {
    id: 'caio',
    name: 'Caio Menezes',
    role: 'Barbeiro',
    bio: 'Cortes modernos e atendimento nos fins de semana.',
    specialties: ['Corte + Barba', 'Sobrancelha'],
    hours: {
      ...weekdays([3, 4, 5, 6], [['12:00', '21:00']]),
      0: [['09:00', '14:00']],
    },
  },
]

export const getService = (id: string) => SERVICES.find((s) => s.id === id)
export const getBarber = (id: string) => BARBERS.find((b) => b.id === id)
