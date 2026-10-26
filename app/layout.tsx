import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans, Michroma } from 'next/font/google'
import { TopNav } from '@/components/top-nav'
import { Toaster } from '@/components/ui/sonner'
import { RegistryProvider } from '@/lib/store'
import './globals.css'

const michroma = Michroma({ subsets: ['latin'], weight: '400', variable: '--font-michroma' })
const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex' })

export const metadata: Metadata = {
  title: 'Registre Numérique des Contrats',
  description:
    'Pilotage du portefeuille de contrats fournisseurs : échéances, alertes J-30 / J-10, reconductions tacites et workflow litiges.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f9fafc',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${michroma.variable} ${plex.variable}`}>
      <body className="min-h-screen antialiased">
        <RegistryProvider>
          <TopNav />
          <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">{children}</main>
          <Toaster position="bottom-right" />
        </RegistryProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
