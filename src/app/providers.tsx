'use client'

import { KindeProvider } from '@kinde-oss/kinde-auth-nextjs'
import { LiteralProvider } from '@literal-ui/core'
import { Provider as JotaiProvider } from 'jotai'
import { usePathname } from 'next/navigation'

import { Layout, Theme } from '../components'

// Type assertion to work around @literal-ui/core type definition issue
const LiteralProviderAny = LiteralProvider as React.FC<{
  children: React.ReactNode
}>

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Skip providers for /success route (OAuth callback)
  if (pathname === '/success') {
    return <>{children}</>
  }

  return (
    <KindeProvider>
      <LiteralProviderAny>
        <JotaiProvider>
          <Theme />
          <Layout>{children}</Layout>
        </JotaiProvider>
      </LiteralProviderAny>
    </KindeProvider>
  )
}
