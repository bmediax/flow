import useSWR from 'swr'

interface AuthUser {
  id: string
  email: string | null
}

interface AuthStatus {
  isAuthenticated: boolean
  user: AuthUser | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useAuth() {
  const { data, error, isLoading } = useSWR<AuthStatus>(
    '/api/auth/status',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  )

  return {
    isAuthenticated: data?.isAuthenticated ?? false,
    user: data?.user ?? null,
    isLoading,
    error,
  }
}
