# Direção de design

Objetivo: barbearia **clean e premium**, sem cara de template. O foco é o fluxo de agendamento.

## Referências estudadas

- Dribbble: [Barber Booking Mobile App](https://dribbble.com/shots/22904081-Barber-Booking-Mobile-App), [Guile — UI/UX for barbershops](https://dribbble.com/shots/24202305-Guile-Mobile-UI-UX-for-barbershops), coleções de [booking flow](https://dribbble.com/koddist/collections/5895613-Barber-app) e o kit [Casca](https://dribbble.com/mcnup/collections/7547052-Booking).
- Templates de mercado (Lovable, Framer, Webflow): o fluxo em etapas **serviço → barbeiro → data → horário → dados → confirmação** aparece em quase todos e é o que usuário já espera.

O que foi aproveitado: o fluxo e a ideia de poucos cliques. O visual é original.

## Decisões

| Tema | Escolha | Por quê |
|---|---|---|
| Paleta | Creme `#F5F0E6`, tinta `#16120E`, latão `#C08A33`, vinho `#7A1F1F` | Quente e sóbria; o latão só aparece em destaques |
| Tipografia | Fraunces (títulos) + Inter (interface) | Serifa com personalidade nos títulos, leitura limpa nos formulários |
| Assinatura visual | Poste de barbeiro em listras (CSS puro) | Identidade imediata sem depender de fotos |
| Hero | Card "próximo horário livre" calculado de verdade | Mostra o produto funcionando já na primeira dobra |
| Agendamento | Etapas com resumo fixo ao lado (desktop) | O cliente sempre vê o que escolheu e o total |
| Acessibilidade | Foco visível, `aria-pressed`, `prefers-reduced-motion`, contraste AA no texto | |

## Próximos passos visuais

- Trocar monogramas por fotos reais dos barbeiros (hoje não há imagens, o repositório é autocontido).
- Galeria de trabalhos e depoimentos.
- Versão app (React Native ou Capacitor) reaproveitando `packages/core`.
