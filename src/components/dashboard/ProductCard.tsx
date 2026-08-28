import { MapPin } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Product } from '@/hooks/useProducts'

const STATUS_LABEL: Record<string, string> = {
  available: 'Available',
  at_rent: 'At-rent',
  maintenance: 'Maintenance',
  retired: 'Retired',
}

const STATUS_BADGE_VARIANT: Record<string, 'available' | 'atRent' | 'maintenance'> = {
  available: 'available',
  at_rent: 'atRent',
  maintenance: 'maintenance',
  retired: 'maintenance',
}

export function ProductCard({
  product,
  onOpenDetail,
  onMarkAtRent,
  onMarkReturned,
}: {
  product: Product
  onOpenDetail: (product: Product) => void
  onMarkAtRent: (product: Product) => void
  onMarkReturned: (product: Product) => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-3">
        <button type="button" className="flex flex-col gap-1 text-left" onClick={() => onOpenDetail(product)}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{product.name}</span>
            <Badge variant={STATUS_BADGE_VARIANT[product.status] ?? 'maintenance'}>
              {STATUS_LABEL[product.status] ?? product.status}
            </Badge>
          </div>
          {product.current_station && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {product.current_station}
            </span>
          )}
        </button>

        {product.status === 'available' && (
          <Button size="sm" onClick={() => onMarkAtRent(product)}>
            Mark at-rent
          </Button>
        )}
        {product.status === 'at_rent' && (
          <Button size="sm" variant="secondary" onClick={() => onMarkReturned(product)}>
            Mark returned
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
