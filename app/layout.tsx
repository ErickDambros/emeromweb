import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { VLibrasWidget } from '@/components/vlibras'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'RADAR EMERON | Painel Institucional',
  description:
    'Painel institucional de indicadores da EMEROM — unifique planilhas, PDFs e dados de ações para gerar prioridades, agendas, relatórios e indicadores para decisões.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#2E76AA',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <head>
        {/* Aplica o tema salvo antes da pintura para evitar flash (FOUC).
            A escolha do usuário é soberana — sem preferência do sistema. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('radar_theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();",
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}

        {/* Widget Oficial do VLibras */}
        <VLibrasWidget />

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
