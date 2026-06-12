import { createHash } from 'crypto'

// ─── Google Ads — upload de conversão offline (lead qualificado do CRM) ──────
// Sobe a conversão "Lead Qualificado — CRM (Proposta enviada)" criada na conta
// Haganá Paraná (ação secundária — não afeta lances até ser promovida).
// Match por gclid quando existir (leads do quiz salvam no Supabase); sem gclid
// usa Enhanced Conversions for Leads (e-mail/telefone hasheados) — exige os
// "termos de dados do cliente" aceitos no painel do Google Ads.

const API_VERSION = 'v23'
const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID || '6158470003'
const LOGIN_CUSTOMER_ID = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '3037896039'
const CONVERSION_ACTION_ID = process.env.GOOGLE_ADS_QL_CONVERSION_ACTION_ID || '7645880301'

export function googleAdsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN
  )
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

async function getAccessToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
  })
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body })
  if (!res.ok) throw new Error(`Google OAuth ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const json = (await res.json()) as { access_token: string }
  return json.access_token
}

// Formato exigido: "yyyy-mm-dd hh:mm:ss+00:00"
function conversionDateTime(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ` +
         `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}+00:00`
}

export interface GoogleQualifiedLeadInput {
  gclid?: string
  email?: string
  phone?: string   // qualquer formato BR; normalizado para E.164 aqui
  value?: number
}

export async function uploadGoogleQualifiedLead(
  input: GoogleQualifiedLeadInput
): Promise<{ status: 'success' | 'skipped' | 'error'; detail?: string }> {
  if (!googleAdsConfigured()) return { status: 'skipped', detail: 'env Google Ads ausente' }
  if (!input.gclid && !input.email && !input.phone) {
    return { status: 'skipped', detail: 'sem gclid nem e-mail/telefone' }
  }

  const userIdentifiers: Record<string, string>[] = []
  if (input.email) {
    userIdentifiers.push({ hashedEmail: sha256(input.email.trim().toLowerCase()) })
  }
  if (input.phone) {
    const digits = input.phone.replace(/\D/g, '')
    const e164 = `+${digits.startsWith('55') ? digits : `55${digits}`}`
    userIdentifiers.push({ hashedPhoneNumber: sha256(e164) })
  }

  const conversion: Record<string, unknown> = {
    conversionAction: `customers/${CUSTOMER_ID}/conversionActions/${CONVERSION_ACTION_ID}`,
    conversionDateTime: conversionDateTime(),
    conversionValue: input.value ?? 0,
    currencyCode: 'BRL',
  }
  if (input.gclid) conversion.gclid = input.gclid
  if (userIdentifiers.length) conversion.userIdentifiers = userIdentifiers.slice(0, 5)

  const token = await getAccessToken()
  const res = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${CUSTOMER_ID}:uploadClickConversions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        'login-customer-id': LOGIN_CUSTOMER_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversions: [conversion], partialFailure: true }),
    }
  )

  if (!res.ok) {
    return { status: 'error', detail: `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` }
  }
  const json = (await res.json()) as { partialFailureError?: { message?: string } }
  if (json.partialFailureError) {
    return { status: 'error', detail: (json.partialFailureError.message || 'partial failure').slice(0, 300) }
  }
  return { status: 'success' }
}
