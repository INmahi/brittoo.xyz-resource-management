import { useCallback, useEffect, useId, useState } from 'react'

import { supabase } from '@/lib/supabaseClient'
import type { Tables } from '@/types/database.types'

export type ProductType = Tables<'product_types'>

export function useProductTypes() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('product_types')
      .select('*')
      .is('deleted_at', null)
      .order('label')
    setProductTypes(data ?? [])
    setLoading(false)
  }, [])

  const instanceId = useId()

  useEffect(() => {
    void refresh()
    const channel = supabase
      .channel(`product_types_changes_${instanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_types' }, () => void refresh())
      .subscribe()
    return () => void supabase.removeChannel(channel)
  }, [refresh, instanceId])

  return { productTypes, loading, refresh }
}
