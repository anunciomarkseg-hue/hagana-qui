// Integração direta com o RD Station CRM (cria a negociação via API, já com os
// campos personalizados do quiz preenchidos). Os IDs dos campos/usuário são
// resolvidos em runtime pelo nome/email — assim não dependem de IDs fixos.

const CRM_BASE = 'https://crm.rdstation.com/api/v1'
const OWNER_EMAIL = 'erick.bonjorno@hagana.com.br'

// Nome do campo no CRM (label) → de onde tirar o valor no payload do lead
const FIELD_MAP: Record<string, 'score' | 'perfil' | 'respostas'> = {
  'quiz score': 'score',
  'quiz perfil': 'perfil',
  'quiz resposta': 'respostas',
  'quiz respostas': 'respostas',
}

interface CrmLead {
  name: string
  email: string
  phone: string
  company?: string
  score: number
  label: string
  summary: string
}

interface Resolved {
  fields: Array<{ id: string; from: 'score' | 'perfil' | 'respostas' }>
  userId: string | null
}

let cache: { data: Resolved; at: number } | null = null
const CACHE_TTL = 10 * 60 * 1000

async function crmGet(path: string, token: string): Promise<unknown> {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${CRM_BASE}${path}${sep}token=${token}`)
  if (!res.ok) throw new Error(`CRM GET ${path} → ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

function asArray(v: unknown, ...keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(v)) return v as Record<string, unknown>[]
  if (v && typeof v === 'object') {
    for (const k of keys) {
      const inner = (v as Record<string, unknown>)[k]
      if (Array.isArray(inner)) return inner as Record<string, unknown>[]
    }
  }
  return []
}

function idOf(o: Record<string, unknown>): string | undefined {
  return (o._id as string) || (o.id as string) || undefined
}

async function resolve(token: string): Promise<Resolved> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.data

  const cfRaw = await crmGet('/custom_fields?for=deal', token)
  const fields: Resolved['fields'] = []
  for (const f of asArray(cfRaw, 'custom_fields', 'fields')) {
    const id = idOf(f)
    const label = String(f.label ?? f.name ?? '').trim().toLowerCase()
    const from = FIELD_MAP[label]
    if (id && from) fields.push({ id, from })
  }

  let userId: string | null = null
  try {
    const usersRaw = await crmGet('/users', token)
    const user = asArray(usersRaw, 'users').find(
      u => String(u.email ?? '').trim().toLowerCase() === OWNER_EMAIL
    )
    userId = user ? idOf(user) ?? null : null
  } catch {
    userId = null
  }

  const data: Resolved = { fields, userId }
  cache = { data, at: Date.now() }
  return data
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

// Diagnóstico: confere token, campos resolvidos e dono — sem expor o token
export async function debugRDCRM() {
  const token = process.env.RD_CRM_TOKEN
  if (!token) return { tokenSet: false }
  cache = null // força resolução fresca no debug
  try {
    const { fields, userId } = await resolve(token)
    return {
      tokenSet: true,
      fieldsFound: fields.map(f => f.from),
      fieldCount: fields.length,
      ownerResolved: Boolean(userId),
    }
  } catch (err) {
    return { tokenSet: true, error: String(err).slice(0, 500) }
  }
}

function buildCustomFields(token: Resolved, lead: CrmLead) {
  const valueFor: Record<'score' | 'perfil' | 'respostas', string> = {
    score: String(lead.score),
    perfil: lead.label,
    respostas: lead.summary,
  }
  return token.fields.length
    ? token.fields.map(f => ({ custom_field_id: f.id, value: valueFor[f.from] }))
    : undefined
}

export async function sendToRDCRM(lead: CrmLead): Promise<{ status: 'success' | 'skipped'; dealId?: string }> {
  const token = process.env.RD_CRM_TOKEN
  if (!token) {
    console.warn('[RD CRM] RD_CRM_TOKEN não configurado — pulando')
    return { status: 'skipped' }
  }

  const resolved = await resolve(token)
  const customFields = buildCustomFields(resolved, lead)

  const deal: Record<string, unknown> = { name: lead.name }
  if (resolved.userId) deal.user_id = resolved.userId
  if (customFields) deal.deal_custom_fields = customFields

  const body = {
    deal,
    contacts: [
      {
        name: lead.name,
        emails: [{ email: lead.email }],
        phones: [{ phone: normalizePhone(lead.phone), type: 'cellphone' }],
      },
    ],
  }

  const res = await fetch(`${CRM_BASE}/deals?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`RD CRM deal ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  const created = (await res.json().catch(() => null)) as Record<string, unknown> | null
  const dealId = created ? (created.id ?? created._id) : undefined
  console.log('[RD CRM] Negociação criada', { dealId, fields: resolved.fields.length, owner: resolved.userId ? 'Erick' : 'default' })
  return { status: 'success', dealId: dealId ? String(dealId) : undefined }
}

// Atualiza uma negociação já existente (criada no lead parcial da Q5) com os
// dados finais do quiz — em vez de criar um deal novo e duplicar no funil.
export async function updateRDCRMDeal(dealId: string, lead: CrmLead): Promise<{ status: 'success' | 'skipped' }> {
  const token = process.env.RD_CRM_TOKEN
  if (!token) return { status: 'skipped' }

  const resolved = await resolve(token)
  const customFields = buildCustomFields(resolved, lead)

  const deal: Record<string, unknown> = { name: lead.name }
  if (customFields) deal.deal_custom_fields = customFields

  const res = await fetch(`${CRM_BASE}/deals/${dealId}?token=${token}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deal }),
  })

  if (!res.ok) {
    throw new Error(`RD CRM update ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  console.log('[RD CRM] Negociação atualizada', { dealId })
  return { status: 'success' }
}
