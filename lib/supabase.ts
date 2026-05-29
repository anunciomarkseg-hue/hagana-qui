/**
 * Cliente Supabase server-side only.
 *
 * Compartilha o mesmo banco do projeto `dashboard-marketing` — escreve em
 * `quiz_events` e `quiz_leads`, lê `rd_leads` se precisar fazer JOIN.
 *
 * IMPORTANTE: este arquivo só deve ser importado em route handlers do server.
 * Nunca importar no client (`'use client'`) — a SERVICE_KEY é secret.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_KEY ausente — tracking avançado desabilitado')
    return null
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
