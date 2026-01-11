import './styles.css'
import 'react-photo-view/dist/react-photo-view.css'

import { KindeProvider } from '@kinde-oss/kinde-auth-nextjs'
import { LiteralProvider } from '@literal-ui/core'
import { ErrorBoundary } from '@sentry/nextjs'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { RecoilRoot } from 'recoil'

import { Layout, Theme } from '../components'

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  if (router.pathname === '/success') return <Component {...pageProps} />

  return (
    <ErrorBoundary fallback={<Fallback />}>
      <KindeProvider>
        <LiteralProvider>
          <RecoilRoot>
            <Theme />
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </RecoilRoot>
        </LiteralProvider>
      </KindeProvider>
    </ErrorBoundary>
  )
}

const Fallback: React.FC = () => {
  return <div>Something went wrong.</div>
}
