import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { supabase } from '@/lib/supabaseClient'
import type { Tables } from '@/types/database.types'

export type Owner = Tables<'owners'>
export type Renter = Tables<'renters'>

function useContactTable<T>(table: 'owners' | 'renters') {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const requestIdRef = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current
    const { data } = await supabase.from(table).select('*').is('deleted_at', null).order('name')
    if (requestId !== requestIdRef.current) return
    setRows((data as T[]) ?? [])
    setLoading(false)
  }, [])

  const instanceId = useId()

  useEffect(() => {
    void refresh()
    const channel = supabase
      .channel(`${table}_changes_${instanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => void refresh())
      .subscribe()
    return () => void supabase.removeChannel(channel)
  }, [refresh, instanceId])

  return { rows, loading, refresh }
}

export function useOwners() {
  const { rows, loading, refresh } = useContactTable<Owner>('owners')
  return { owners: rows, loading, refresh }
}

export function useRenters() {
  const { rows, loading, refresh } = useContactTable<Renter>('renters')
  return { renters: rows, loading, refresh }
}

export async function createOwner(name: string, phone: string, notes?: string) {
  return supabase.from('owners').insert({ name, phone, notes }).select('*').single()
}

export async function createRenter(name: string, phone: string, notes?: string) {
  return supabase.from('renters').insert({ name, phone, notes }).select('*').single()
}

export async function softDeleteContact(kind: 'owner' | 'renter', id: number) {
  const table = kind === 'owner' ? 'owners' : 'renters'
  return supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id)
}

export async function restoreContact(kind: 'owner' | 'renter', id: number) {
  const table = kind === 'owner' ? 'owners' : 'renters'
  return supabase.from(table).update({ deleted_at: null }).eq('id', id)
}
