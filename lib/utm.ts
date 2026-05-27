const UTM_KEY = 'hq_utm'

export interface UTMData {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
}

export function captureUTMs(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const utm: UTMData = {}
  if (params.get('utm_source'))   utm.source   = params.get('utm_source')!
  if (params.get('utm_medium'))   utm.medium   = params.get('utm_medium')!
  if (params.get('utm_campaign')) utm.campaign = params.get('utm_campaign')!
  if (params.get('utm_content'))  utm.content  = params.get('utm_content')!
  if (params.get('utm_term'))     utm.term     = params.get('utm_term')!
  if (Object.keys(utm).length > 0) {
    sessionStorage.setItem(UTM_KEY, JSON.stringify(utm))
  }
}

export function getStoredUTMs(): UTMData {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(UTM_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export interface MetaCookies {
  fbp?: string
  fbc?: string
}

export function getMetaCookies(): MetaCookies {
  if (typeof document === 'undefined') return {}
  const cookies = Object.fromEntries(
    document.cookie.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )
  const result: MetaCookies = {}
  if (cookies._fbp) result.fbp = cookies._fbp
  if (cookies._fbc) {
    result.fbc = cookies._fbc
  } else {
    // Constrói _fbc a partir do fbclid se o cookie ainda não foi criado
    const fbclid = new URLSearchParams(window.location.search).get('fbclid')
    if (fbclid) result.fbc = `fb.1.${Date.now()}.${fbclid}`
  }
  return result
}
