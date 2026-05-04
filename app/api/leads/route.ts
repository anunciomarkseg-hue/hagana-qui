import { NextRequest, NextResponse } from 'next/server'

// TODO: Configure your RD Station token in .env.local:
// RD_TOKEN=seu_token_aqui
// Get it at: app.rdstation.com.br → Integrações → API

interface UTMData {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
}

interface LeadPayload {
  name: string
  email: string
  phone: string
  company?: string
  score: number
  label: string
  summary: string
  utm?: UTMData
}

async function sendToRDStation(data: LeadPayload) {
  const token = process.env.RD_TOKEN
  if (!token) {
    console.warn('[RD Station] RD_TOKEN not configured — skipping CRM sync')
    return
  }

  const body = {
    event_type: 'CONVERSION',
    event_family: 'CDP',
    payload: {
      conversion_identifier: 'quiz-hagana',
      name: data.name,
      email: data.email,
      mobile_phone: data.phone,
      company_name: data.company ?? '',
      cf_quiz_score: String(data.score),
      cf_quiz_perfil: data.label,
      cf_quiz_respostas: data.summary,
      tags: ['quiz-hagana', `lead-${data.label}`, 'curitiba'],
      ...(data.utm?.source   && { traffic_source:   data.utm.source }),
      ...(data.utm?.medium   && { traffic_medium:   data.utm.medium }),
      ...(data.utm?.campaign && { traffic_campaign: data.utm.campaign }),
      ...(data.utm?.content  && { traffic_content:  data.utm.content }),
      ...(data.utm?.term     && { traffic_value:    data.utm.term }),
    },
  }

  const res = await fetch(`https://api.rd.services/platform/conversions?api_key=${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`RD Station error ${res.status}: ${err}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    const data: LeadPayload = await req.json()

    if (!data.name || !data.email || !data.phone) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    await sendToRDStation(data)

    console.log('[Lead]', {
      name: data.name,
      email: data.email,
      score: data.score,
      label: data.label,
      ts: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API /leads]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
