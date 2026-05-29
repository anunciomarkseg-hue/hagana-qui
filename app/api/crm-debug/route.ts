import { NextResponse } from 'next/server'
import { debugRDCRM } from '@/lib/rd-crm'

export async function GET() {
  const result = await debugRDCRM()
  return NextResponse.json(result)
}
