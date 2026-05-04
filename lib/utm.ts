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
