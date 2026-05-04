'use client'

import { useEffect } from 'react'
import { captureUTMs } from '@/lib/utm'

export default function UTMCapture() {
  useEffect(() => { captureUTMs() }, [])
  return null
}
