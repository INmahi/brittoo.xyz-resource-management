import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Owner, Renter } from '@/hooks/useContacts'
import type { Product } from '@/hooks/useProducts'
import { supabase } from '@/lib/supabaseClient'
import { notifyWithUndo } from '@/lib/toastActions'
import type { Tables } from '@/types/database.types'

type RentalEvent = Tables<'rental_events'>

const NONE = '__none__'

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
  const [editing, setEditing] = useState(false)
  const [station, setStation] = useState('')
  const [keyHolder, setKeyHolder] = useState('')
  const [ownerId, setOwnerId] = useState(NONE)
  const [renterId, setRenterId] = useState(NONE)
  const [saving, setSaving] = useState(false)

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

  useEffect(() => {
    setEditing(false)
  }, [product?.id])

  if (!product) return null

  const owner = owners.find((o) => o.id === product.current_owner_id)
  const renter = renters.find((r) => r.id === product.current_renter_id)
  const attributes = (product.attributes ?? {}) as Record<string, string>

  function startEditing() {
    setStation(product!.current_station ?? '')
    setKeyHolder(product!.current_key_holder ?? '')
    setOwnerId(product!.current_owner_id ? String(product!.current_owner_id) : NONE)
    setRenterId(product!.current_renter_id ? String(product!.current_renter_id) : NONE)
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    await supabase
      .from('products')
      .update({
        current_station: station || null,
        current_key_holder: keyHolder || null,
        current_owner_id: ownerId === NONE ? null : Number(ownerId),
        current_renter_id: product!.status === 'at_rent' ? (renterId === NONE ? null : Number(renterId)) : product!.current_renter_id,
      })
      .eq('id', product!.id)
    setSaving(false)
    setEditing(false)
    onChanged()
  }

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
        <SheetHeader className="flex-row items-start justify-between gap-2 space-y-0">
          <div>
            <SheetTitle>{product.name}</SheetTitle>
            <SheetDescription>{product.code ?? 'No code'}</SheetDescription>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil /> Edit
            </Button>
          )}
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

          {editing ? (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-station">Station</Label>
                <Input id="edit-station" value={station} onChange={(e) => setStation(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-keyHolder">Key holder</Label>
                <Input id="edit-keyHolder" value={keyHolder} onChange={(e) => setKeyHolder(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Owner</Label>
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {owners.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name} · {o.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {product.status === 'at_rent' && (
                <div className="flex flex-col gap-1.5">
                  <Label>Renter</Label>
                  <Select value={renterId} onValueChange={setRenterId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select renter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {renters.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.name} · {r.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" disabled={saving} onClick={handleSave}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
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
          )}

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
