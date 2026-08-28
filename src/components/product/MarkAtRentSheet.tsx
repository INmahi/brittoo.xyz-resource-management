import { useState } from 'react'

import { ContactQuickAdd } from '@/components/contacts/ContactQuickAdd'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useRenters } from '@/hooks/useContacts'
import { changeProductStatus } from '@/lib/productActions'
import type { Product } from '@/hooks/useProducts'

export function MarkAtRentSheet({
  product,
  open,
  onOpenChange,
  onDone,
}: {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const { renters, refresh: refreshRenters } = useRenters()
  const [renterId, setRenterId] = useState<string>('')
  const [addingRenter, setAddingRenter] = useState(false)
  const [station, setStation] = useState('')
  const [keyHolder, setKeyHolder] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!product) return null

  function reset() {
    setRenterId('')
    setStation('')
    setKeyHolder('')
    setError(null)
    setAddingRenter(false)
  }

  async function handleSubmit() {
    if (!renterId) {
      setError('Select or add a renter.')
      return
    }
    setError(null)
    setSubmitting(true)
    const result = await changeProductStatus({
      productId: product!.id,
      expectedVersion: product!.status_version,
      newStatus: 'at_rent',
      renterId: Number(renterId),
      ownerId: product!.current_owner_id,
      station: station || product!.current_station,
      keyHolder: keyHolder || null,
    })
    setSubmitting(false)

    if (result.conflict) {
      setError('This product was just updated by someone else. Refresh and try again.')
      return
    }
    if (result.error) {
      setError(result.error)
      return
    }

    reset()
    onOpenChange(false)
    onDone()
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Mark at-rent: {product.name}</SheetTitle>
          <SheetDescription>Record who's renting it, where, and who holds the key.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label>Renter</Label>
            {addingRenter ? (
              <ContactQuickAdd
                kind="renter"
                onCreated={(renter) => {
                  refreshRenters()
                  setRenterId(String(renter.id))
                  setAddingRenter(false)
                }}
                onCancel={() => setAddingRenter(false)}
              />
            ) : (
              <div className="flex gap-2">
                <Select value={renterId} onValueChange={setRenterId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select renter" />
                  </SelectTrigger>
                  <SelectContent>
                    {renters.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name} · {r.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={() => setAddingRenter(true)}>
                  New
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="station">Station</Label>
            <Input
              id="station"
              placeholder={product.current_station ?? 'e.g. Main gate'}
              value={station}
              onChange={(e) => setStation(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="keyHolder">Key holder</Label>
            <Input
              id="keyHolder"
              placeholder="e.g. with renter"
              value={keyHolder}
              onChange={(e) => setKeyHolder(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <SheetFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Confirm at-rent'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
