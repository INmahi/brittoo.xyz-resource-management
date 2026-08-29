import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Owner, Renter } from '@/hooks/useContacts'
import type { Product } from '@/hooks/useProducts'
import { supabase } from '@/lib/supabaseClient'
import { notifyWithUndo } from '@/lib/toastActions'
import type { Tables } from '@/types/database.types'

type RentalEvent = Tables<'rental_events'>

export function ProductDetailPanel({
  product,
  owners,
  renters,
  open,
  onOpenChange,
  onChanged,
}: {
  product: Product | null
  owners: Owner[]
  renters: Renter[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}) {
  const [events, setEvents] = useState<RentalEvent[]>([])

  useEffect(() => {
    if (!open || !product) return
    supabase
      .from('rental_events')
      .select('*')
      .eq('product_id', product.id)
      .order('occurred_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setEvents(data ?? []))
  }, [open, product])

  if (!product) return null

  const owner = owners.find((o) => o.id === product.current_owner_id)
  const renter = renters.find((r) => r.id === product.current_renter_id)
  const attributes = (product.attributes ?? {}) as Record<string, string>

  async function handleDelete() {
    const productId = product!.id
    const productName = product!.name
    await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', productId)
    onOpenChange(false)
    onChanged()
    notifyWithUndo(`${productName} removed`, async () => {
      await supabase.from('products').update({ deleted_at: null }).eq('id', productId)
      onChanged()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{product.name}</SheetTitle>
          <SheetDescription>{product.code ?? 'No code'}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(attributes).map(([key, value]) =>
              value ? (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ) : null,
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Station</p>
              <p>{product.current_station ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Key holder</p>
              <p>{product.current_key_holder ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Owner</p>
              {owner ? (
                <a href={`tel:${owner.phone}`} className="text-primary underline-offset-4 hover:underline">
                  {owner.name} · {owner.phone}
                </a>
              ) : (
                <p>—</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Renter</p>
              {renter ? (
                <a href={`tel:${renter.phone}`} className="text-primary underline-offset-4 hover:underline">
                  {renter.name} · {renter.phone}
                </a>
              ) : (
                <p>—</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Recent activity</p>
            <div className="flex flex-col gap-2">
              {events.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
              {events.map((event) => (
                <div key={event.id} className="rounded-md border border-border p-2 text-xs">
                  <p className="font-medium">{event.event_type.replaceAll('_', ' ')}</p>
                  <p className="text-muted-foreground">{new Date(event.occurred_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <Button variant="destructive" size="sm" className="self-start" onClick={handleDelete}>
            <Trash2 /> Delete product
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
