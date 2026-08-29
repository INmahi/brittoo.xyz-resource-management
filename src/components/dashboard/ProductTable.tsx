import { Check, Pause, Trash2, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { Product } from '@/hooks/useProducts'
import { setProductAvailability } from '@/lib/productActions'
import { supabase } from '@/lib/supabaseClient'
import { notifyWithUndo } from '@/lib/toastActions'
import { cn } from '@/lib/utils'

function RemarksCell({ product }: { product: Product }) {
  const [value, setValue] = useState(product.remarks ?? '')

  async function save() {
    if (value === (product.remarks ?? '')) return
    await supabase.from('products').update({ remarks: value || null }).eq('id', product.id)
  }

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
      placeholder="—"
      className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm outline-none hover:border-input focus:border-input focus:bg-background"
    />
  )
}

function AvailabilityCell({ product, onMarkAtRent, onMarkReturned }: { product: Product; onMarkAtRent: (p: Product) => void; onMarkReturned: (p: Product) => void }) {
  async function setDirect(newStatus: 'available' | 'maintenance', label: string) {
    const undoStatus = newStatus === 'available' ? 'maintenance' : 'available'
    const result = await setProductAvailability(product, newStatus)
    if (result.error) return
    notifyWithUndo(`${product.name} ${label}`, async () => {
      await setProductAvailability(product, undoStatus)
    })
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={product.status === 'available'}
        onClick={() => (product.status === 'at_rent' ? onMarkReturned(product) : setDirect('available', 'marked available'))}
        title="Available"
        className={cn(
          'size-7 rounded-full',
          product.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700',
        )}
      >
        <Check className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={product.status === 'at_rent'}
        onClick={() => onMarkAtRent(product)}
        title="At-rent"
        className={cn(
          'size-7 rounded-full',
          product.status === 'at_rent' ? 'bg-red-100 text-red-700' : 'text-muted-foreground hover:bg-red-50 hover:text-red-700',
        )}
      >
        <X className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={product.status === 'maintenance'}
        onClick={() => setDirect('maintenance', 'marked temporarily unavailable')}
        title="Temporarily unavailable"
        className={cn(
          'size-7 rounded-full',
          product.status === 'maintenance' ? 'bg-amber-100 text-amber-700' : 'text-muted-foreground hover:bg-amber-50 hover:text-amber-700',
        )}
      >
        <Pause className="size-4" />
      </Button>
    </div>
  )
}

export function ProductTable({
  products,
  onOpenDetail,
  onMarkAtRent,
  onMarkReturned,
  onDeleted,
}: {
  products: Product[]
  onOpenDetail: (product: Product) => void
  onMarkAtRent: (product: Product) => void
  onMarkReturned: (product: Product) => void
  onDeleted: () => void
}) {
  async function handleDelete(product: Product) {
    await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', product.id)
    onDeleted()
    notifyWithUndo(`${product.name} removed`, async () => {
      await supabase.from('products').update({ deleted_at: null }).eq('id', product.id)
      onDeleted()
    })
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
            <th className="p-2 font-medium">Product</th>
            <th className="p-2 text-center font-medium">Available</th>
            <th className="p-2 font-medium">Remarks</th>
            <th className="p-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-border last:border-0">
              <td className="p-2">
                <button type="button" className="text-left font-medium hover:underline" onClick={() => onOpenDetail(product)}>
                  {product.name}
                </button>
                {product.current_station && <p className="text-xs text-muted-foreground">{product.current_station}</p>}
              </td>
              <td className="p-1">
                <AvailabilityCell product={product} onMarkAtRent={onMarkAtRent} onMarkReturned={onMarkReturned} />
              </td>
              <td className="p-1">
                <RemarksCell product={product} />
              </td>
              <td className="p-1 text-right">
                <Button variant="ghost" size="icon" onClick={() => handleDelete(product)}>
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
