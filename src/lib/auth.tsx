import type { Session, User } from '@supabase/supabase-js'
import { createContext, use, useEffect, useState, type ReactNode } from 'react'

import { supabase } from '@/lib/supabaseClient'
import type { Tables } from '@/types/database.types'

type Coordinator = Tables<'coordinators'>

type AuthContextValue = {
  session: Session | null
  user: User | null
  coordinator: Coordinator | null
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshCoordinator: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadCoordinator(userId: string) {
    const { data } = await supabase.from('coordinators').select('*').eq('id', userId).maybeSingle()
    setCoordinator(data ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) void loadCoordinator(data.session.user.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) void loadCoordinator(newSession.user.id)
      else setCoordinator(null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signInWithPassword(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshCoordinator() {
    if (session) await loadCoordinator(session.user.id)
  }

  return (
    <AuthContext
      value={{
        session,
        user: session?.user ?? null,
        coordinator,
        loading,
        signInWithPassword,
        signUp,
        signOut,
        refreshCoordinator,
      }}
    >
      {children}
    </AuthContext>
  )
}

export function useAuth() {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
