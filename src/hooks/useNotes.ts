import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { supabase } from '@/lib/supabaseClient'

export type Note = {
  id: string
  body: string
  coordinator_id: string
  created_at: string
  author_name: string | null
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const requestIdRef = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current
    const { data } = await supabase
      .from('notes')
      .select('id, body, coordinator_id, created_at, coordinator:coordinators(full_name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (requestId !== requestIdRef.current) return
    setNotes(
      (data ?? []).map((n) => ({
        id: n.id,
        body: n.body,
        coordinator_id: n.coordinator_id,
        created_at: n.created_at,
        author_name: (n.coordinator as { full_name: string } | null)?.full_name ?? null,
      })),
    )
    setLoading(false)
  }, [])

  const instanceId = useId()

  useEffect(() => {
    void refresh()
    const channel = supabase
      .channel(`notes_changes_${instanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => void refresh())
      .subscribe()
    return () => void supabase.removeChannel(channel)
  }, [refresh, instanceId])

  return { notes, loading, refresh }
}

export async function createNote(body: string) {
  return supabase.from('notes').insert({ body }).select('id').single()
}

export async function softDeleteNote(id: string) {
  return supabase.from('notes').update({ deleted_at: new Date().toISOString() }).eq('id', id)
}

export async function restoreNote(id: string) {
  return supabase.from('notes').update({ deleted_at: null }).eq('id', id)
}
