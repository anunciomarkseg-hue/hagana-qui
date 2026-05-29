const SESSION_KEY = 'hq_session_id'

/**
 * Retorna um UUID persistente da sessão atual.
 * Persistido em sessionStorage — vive enquanto a aba está aberta.
 * Usado pra correlacionar eventos do funil no banco.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

/**
 * Captura fbclid e gclid da URL atual.
 * UTMs já estão em lib/utm.ts.
 */
export function getClickIds(): { fbclid?: string; gclid?: string } {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const out: { fbclid?: string; gclid?: string } = {}
  const fbclid = params.get('fbclid')
  const gclid = params.get('gclid')
  if (fbclid) out.fbclid = fbclid
  if (gclid) out.gclid = gclid
  return out
}
