export const config = {
  token: process.env.WHATSAPP_TOKEN ?? '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? '',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? '',
  appSecret: process.env.WHATSAPP_APP_SECRET ?? '',
  graphVersion: process.env.GRAPH_API_VERSION ?? 'v21.0',
  port: Number(process.env.PORT ?? 3000),
  siteUrl: process.env.SITE_URL ?? 'http://localhost:5173/',
  /** Sem credenciais, as respostas só são impressas no console. */
  get dryRun() {
    return !this.token || !this.phoneNumberId
  },
}
