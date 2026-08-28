import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Product } from '@/hooks/useProducts'
import { changeProductStatus } from '@/lib/productActions'

export function MarkReturnedSheet({
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
  const [station, setStation] = useState('')
  const [keyHolder, setKeyHolder] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!product) return null

  function reset() {
    setStation('')
    setKeyHolder('')
    setError(null)
  }

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    const result = await changeProductStatus({
      productId: product!.id,
      expectedVersion: product!.status_version,
      newStatus: 'available',
      renterId: null,
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
          <SheetTitle>Mark returned: {product.name}</SheetTitle>
          <SheetDescription>Confirm where it's back and who has the key now.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="return-station">Station</Label>
            <Input
              id="return-station"
              placeholder={product.current_station ?? 'e.g. Main gate'}
              value={station}
              onChange={(e) => setStation(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="return-keyHolder">Key holder</Label>
            <Input
              id="return-keyHolder"
              placeholder="e.g. coordinator"
              value={keyHolder}
              onChange={(e) => setKeyHolder(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <SheetFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Confirm returned'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
