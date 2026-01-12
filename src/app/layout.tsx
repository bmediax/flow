import './globals.css'
import 'react-photo-view/dist/react-photo-view.css'

import type { Metadata, Viewport } from 'next'

import { Providers } from './providers'

const background = {
  light: 'white',
  dark: '#24292e',
}

export const metadata: Metadata = {
  title: 'Reader',
  icons: {
    icon: '/icons/192.png',
    apple: '/icons/192.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  themeColor: background.light,
}

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-default" suppressHydrationWarning>
      <head>
        <meta id="theme-color" name="theme-color" content={background.light} />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .bg-default, .hover\\:bg-default:hover {
                background: ${background.light};
              }
              .dark.bg-default, .dark .bg-default, .dark .hover\\:bg-default:hover {
                background: ${background.dark};
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `const background=${JSON.stringify(background)}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              var mql = window.matchMedia('(prefers-color-scheme: dark)');
              var scheme = localStorage.getItem('literal-color-scheme') ?? 'system';
              if (scheme === '"dark"' || (scheme === '"system"' && mql.matches)) {
                document.documentElement.classList.toggle('dark', true);
                document.querySelector('#theme-color')?.setAttribute('content', '${background.dark}');
              }
            })();`,
          }}
        />
      </head>
      <body>
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
