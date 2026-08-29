import { supabase } from '@/lib/supabaseClient'
import type { Product } from '@/hooks/useProducts'

export async function changeProductStatus(params: {
  productId: string
  expectedVersion: number
  newStatus: 'available' | 'at_rent' | 'maintenance' | 'retired'
  renterId: number | null
  ownerId: number | null
  station: string | null
  keyHolder: string | null
}) {
  const { data, error } = await supabase.rpc('change_product_status', {
    p_product_id: params.productId,
    p_expected_version: params.expectedVersion,
    p_new_status: params.newStatus,
    p_renter_id: params.renterId,
    p_owner_id: params.ownerId,
    p_station: params.station,
    p_key_holder: params.keyHolder,
    p_event_id: crypto.randomUUID(),
    p_client_occurred_at: new Date().toISOString(),
  })

  if (error) {
    if (error.message.includes('version_conflict')) {
      return { data: null, conflict: true, error: null }
    }
    return { data: null, conflict: false, error: error.message }
  }

  return { data, conflict: false, error: null }
}

/** Direct status changes that don't need renter/owner capture (unlike at-rent/returned). */
export async function setProductAvailability(product: Product, newStatus: 'available' | 'maintenance') {
  return changeProductStatus({
    productId: product.id,
    expectedVersion: product.status_version,
    newStatus,
    renterId: newStatus === 'available' ? null : product.current_renter_id,
    ownerId: product.current_owner_id,
    station: product.current_station,
    keyHolder: product.current_key_holder,
  })
}
