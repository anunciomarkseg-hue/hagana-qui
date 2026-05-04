'use client'

import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  strong?: boolean
}

export default function GlassCard({ children, className = '', strong = false }: GlassCardProps) {
  return (
    <div className={`relative rounded-2xl noise ${strong ? 'glass-strong' : 'glass'} ${className}`}>
      {children}
    </div>
  )
}
