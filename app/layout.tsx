import type { Metadata } from 'next'
import './globals.css'
import UTMCapture from '@/components/UTMCapture'

export const metadata: Metadata = {
  title: 'Grupo Haganá Paraná — Análise Personalizada',
  description: 'Descubra qual solução de segurança e facilities é ideal para o seu empreendimento. Análise personalizada para Curitiba e Região Metropolitana.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Grupo Haganá Paraná — Análise Personalizada',
    description: 'Descubra qual solução de segurança é ideal para o seu empreendimento.',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* GTM */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-W5RXSCG8');` }} />
        {/* Meta Pixel 724771557389668 */}
        <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','724771557389668');fbq('track','PageView');` }} />
        <noscript dangerouslySetInnerHTML={{ __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=724771557389668&ev=PageView&noscript=1"/>` }} />
      </head>
      <body className="antialiased">
        <noscript dangerouslySetInnerHTML={{ __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-W5RXSCG8" height="0" width="0" style="display:none;visibility:hidden"></iframe>` }} />
        <UTMCapture />
        {children}
      </body>
    </html>
  )
}
