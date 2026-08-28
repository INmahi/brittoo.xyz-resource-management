import { useCallback, useEffect, useId, useState } from 'react'

import { supabase } from '@/lib/supabaseClient'
import type { Tables } from '@/types/database.types'

export type Product = Tables<'products'>

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .is('deleted_at', null)
      .order('name')
    setProducts(data ?? [])
    setLoading(false)
  }, [])

  const instanceId = useId()

  useEffect(() => {
    void refresh()
    const channel = supabase
      .channel(`products_changes_${instanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => void refresh())
      .subscribe()
    return () => void supabase.removeChannel(channel)
  }, [refresh, instanceId])

  return { products, loading, refresh }
}
