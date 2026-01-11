declare module '@kinde-oss/kinde-auth-nextjs' {
  import { ReactNode } from 'react'

  export interface KindeProviderProps {
    children: ReactNode
  }

  export function KindeProvider(props: KindeProviderProps): JSX.Element

  export interface KindeUser {
    id: string
    email: string | null
    given_name: string | null
    family_name: string | null
    picture: string | null
  }

  export interface UseKindeAuthReturn {
    isAuthenticated: boolean
    isLoading: boolean
    user: KindeUser | null
    getAccessToken: () => Promise<string | null>
    getIdToken: () => Promise<string | null>
    getPermission: (permission: string) => { isGranted: boolean }
    getPermissions: () => { permissions: string[] }
    getOrganization: () => { orgCode: string | null }
    getUserOrganizations: () => { orgCodes: string[] }
  }

  export function useKindeAuth(): UseKindeAuthReturn
}

declare module '@kinde-oss/kinde-auth-nextjs/server' {
  import type { NextApiRequest, NextApiResponse } from 'next'

  export interface KindeServerSession {
    getUser: () => Promise<{
      id: string
      email: string | null
      given_name: string | null
      family_name: string | null
      picture: string | null
    } | null>
    isAuthenticated: () => Promise<boolean>
    getAccessToken: () => Promise<string | null>
    getIdToken: () => Promise<string | null>
    getPermission: (permission: string) => Promise<{ isGranted: boolean }>
    getPermissions: () => Promise<{ permissions: string[] }>
    getOrganization: () => Promise<{ orgCode: string | null }>
    getUserOrganizations: () => Promise<{ orgCodes: string[] }>
  }

  export function getKindeServerSession(): KindeServerSession

  export function handleAuth(): (
    req: NextApiRequest,
    res: NextApiResponse
  ) => Promise<void>
}

declare module '@kinde-oss/kinde-auth-nextjs/middleware' {
  // eslint-disable-next-line @next/next/no-server-import-in-page
  import type { NextMiddleware } from 'next/server'

  export interface WithAuthOptions {
    isReturnToCurrentPage?: boolean
    loginPage?: string
    publicPaths?: string[]
  }

  export function withAuth(
    middleware?: NextMiddleware,
    options?: WithAuthOptions
  ): NextMiddleware

  export default withAuth
}

declare module '@kinde-oss/kinde-auth-nextjs/components' {
  import { ReactNode, AnchorHTMLAttributes } from 'react'

  interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    children?: ReactNode
    postLoginRedirectURL?: string
    authUrlParams?: Record<string, string>
    org_code?: string
  }

  export function LoginLink(props: LinkProps): JSX.Element
  export function RegisterLink(props: LinkProps): JSX.Element
  export function LogoutLink(props: LinkProps): JSX.Element
  export function CreateOrgLink(props: LinkProps): JSX.Element
}
