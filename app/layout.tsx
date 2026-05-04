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
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-W5RXSCG8');` }} />
      </head>
      <body className="antialiased">
        <noscript dangerouslySetInnerHTML={{ __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-W5RXSCG8" height="0" width="0" style="display:none;visibility:hidden"></iframe>` }} />
        <UTMCapture />
        {children}
      </body>
    </html>
  )
}
