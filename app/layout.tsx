import type { Metadata } from 'next'
import './globals.css'
import UTMCapture from '@/components/UTMCapture'

export const metadata: Metadata = {
  title: 'Haganá Segurança — Análise Gratuita',
  description: 'Descubra em 2 minutos qual solução de segurança e facilities é ideal para o seu espaço. Análise personalizada gratuita.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Haganá Segurança — Análise Gratuita',
    description: 'Descubra qual solução de segurança é ideal para o seu espaço.',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Google Tag Manager — substitua GTM-XXXXXXX pelo seu ID */}
        {/* <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXXXXX');` }} /> */}

        {/* Meta Pixel — substitua PIXEL_ID pelo seu ID */}
        {/* <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){...}` }} /> */}
      </head>
      <body className="antialiased">
        <UTMCapture />
        {children}
      </body>
    </html>
  )
}
