# Navalha Club ✂️

Site de **agendamento para barbearia** + **bot de atendimento no WhatsApp**, com a mesma lógica de horários nos dois canais.

**Demo:** https://matheusgomesrocha.github.io/navalha-club/ (dados fictícios, salvos só no seu navegador)

## O que tem

**Site (`apps/web`)** · Vue 3, TypeScript, Tailwind CSS v4
- Escolha do serviço e do barbeiro
- Horários calculados pelo **expediente de cada barbeiro**, pela duração do serviço e pelos agendamentos existentes
- Dados do cliente com validação e máscara
- Pagamento: **Pix** (QR Code + copia e cola, BR Code real com CRC16), **cartão** (formulário de demonstração) ou **no local**
- Confirmação com código, arquivo de calendário (.ics) e atalho para o WhatsApp
- Responsivo, acessível, com design pensado em primeiro lugar ([decisões](docs/DESIGN.md))

**Bot (`apps/bot`)** · Node, TypeScript, Fastify, WhatsApp Cloud API (oficial)
- Webhook com verificação do token e **validação da assinatura** (`X-Hub-Signature-256`)
- Fluxo com botões e listas: menu → serviço → barbeiro → dia → horário → pagamento
- Pix copia e cola no chat, "meus agendamentos" e **transbordo para atendente humano**
- Deduplicação de mensagens reenviadas pela Meta e sessões com expiração
- **Simulador no terminal**: testa tudo sem conta na Meta

**Core (`packages/core`)** · regras de negócio compartilhadas e testadas (horários, conflitos, Pix, formatação)

## Como rodar

Requer Node 20+.

```bash
npm install

npm run dev        # site em http://localhost:5173
npm test           # testes (core + bot)
npm run bot:chat   # conversa com o bot no terminal
```

### Bot com WhatsApp de verdade

1. Em [Meta for Developers](https://developers.facebook.com/), crie um app **Business** e adicione o produto **WhatsApp**. Você ganha um número de teste gratuito.
2. Copie `apps/bot/.env.example` para `apps/bot/.env` e preencha `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` e `WHATSAPP_APP_SECRET`.
3. `npm run bot` e exponha a porta 3000 com HTTPS (`ngrok http 3000` ou Cloudflare Tunnel).
4. No painel da Meta, cadastre o webhook `https://SEU-DOMINIO/webhook` com o mesmo verify token e assine o campo `messages`.
5. Envie "oi" para o número de teste.

Sem credenciais o servidor sobe em modo *dry-run* e só registra no log o que enviaria.

## Estrutura

```
apps/
  web/    site de agendamento (Vue + Tailwind)
  bot/    bot de WhatsApp (Fastify)
packages/
  core/   regras compartilhadas (horários, Pix, tipos)
docs/     decisões de design
```

## Limitações conhecidas (e próximos passos)

- **Não há backend único ainda.** O site guarda os agendamentos no `localStorage` (por isso funciona no GitHub Pages) e o bot em um arquivo JSON, então os dois canais ainda não enxergam as reservas um do outro. O próximo passo é uma API (por exemplo em Laravel) com banco de dados, consumida pelos dois.
- Pagamentos são **simulados**. Para produção: Pix dinâmico e cartão via PSP (Mercado Pago, Stripe, Asaas), com confirmação por webhook.
- Lembretes automáticos (templates do WhatsApp), cancelamento/remarcação e painel do barbeiro.
- Versão app reaproveitando `packages/core`.

## Licença

MIT

### Testando sem número da Meta: Twilio Sandbox

A Meta restringe o envio do número de teste (EUA) para o Brasil. Para testar do seu celular sem número próprio, o bot também atende a **Twilio Sandbox for WhatsApp** na rota `POST /twilio`. A rota da Meta (`/webhook`) continua igual e é a que vale em produção (tag `meta-cloud-api-v1` guarda o estado só com a Meta).

1. Crie uma conta gratuita na Twilio e abra *Messaging → Try it out → Send a WhatsApp message*.
2. No seu WhatsApp, envie o código de adesão (`join ...`) para o número do sandbox.
3. Em *Sandbox settings*, em **When a message comes in**, use `https://SEU-TUNEL/twilio` (método POST).
4. Mande "oi". As opções chegam numeradas (1, 2, 3...) e você responde com o número, já que o sandbox não tem botões.

Para voltar à Meta, basta usar o número real cadastrado lá: nada precisa mudar no código.
