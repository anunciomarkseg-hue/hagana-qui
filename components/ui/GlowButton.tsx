'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const sizeClasses = {
  sm: 'px-5 py-2.5 text-sm',
  md: 'px-6 py-3.5 text-base',
  lg: 'px-8 py-4 text-lg',
}

export default function GlowButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: GlowButtonProps) {
  return (
    <button
      className={`
        relative inline-flex items-center justify-center gap-2
        font-semibold rounded-xl
        ${variant === 'primary' ? 'btn-primary text-white' : 'btn-secondary text-[rgba(240,244,241,0.8)]'}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        disabled:opacity-40 disabled:pointer-events-none
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}
