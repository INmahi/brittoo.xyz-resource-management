import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { ProductType } from '@/hooks/useProductTypes'

export type StatusFilter = 'all' | 'available' | 'at_rent'

export function FilterBar({
  productTypes,
  typeId,
  onTypeChange,
  status,
  onStatusChange,
  statusCounts,
  attributeOptions,
  attributeFilters,
  onAttributeFilterChange,
  search,
  onSearchChange,
}: {
  productTypes: ProductType[]
  typeId: string
  onTypeChange: (id: string) => void
  status: StatusFilter
  onStatusChange: (status: StatusFilter) => void
  statusCounts: { all: number; available: number; at_rent: number }
  attributeOptions: { key: string; label: string; values: string[] }[]
  attributeFilters: Record<string, string>
  onAttributeFilterChange: (key: string, value: string | null) => void
  search: string
  onSearchChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <Tabs value={status} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="available">Available ({statusCounts.available})</TabsTrigger>
          <TabsTrigger value="at_rent">At-rent ({statusCounts.at_rent})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name or code…"
          className="pl-8"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onTypeChange('all')}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium',
            typeId === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground',
          )}
        >
          All types
        </button>
        {productTypes.map((pt) => (
          <button
            key={pt.id}
            type="button"
            onClick={() => onTypeChange(pt.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium',
              typeId === pt.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground',
            )}
          >
            {pt.label}
          </button>
        ))}
      </div>

      {attributeOptions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {attributeOptions.map((attr) => (
            <div key={attr.key} className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{attr.label}:</span>
              {attr.values.map((value) => {
                const active = attributeFilters[attr.key] === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onAttributeFilterChange(attr.key, active ? null : value)}
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs',
                      active ? 'border-primary bg-secondary text-secondary-foreground' : 'border-border text-muted-foreground',
                    )}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
