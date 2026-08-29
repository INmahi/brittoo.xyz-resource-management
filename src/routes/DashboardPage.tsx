import { useMemo, useState } from 'react'

import { FilterBar, type StatusFilter } from '@/components/dashboard/FilterBar'
import { ProductTable } from '@/components/dashboard/ProductTable'
import { MarkAtRentSheet } from '@/components/product/MarkAtRentSheet'
import { MarkReturnedSheet } from '@/components/product/MarkReturnedSheet'
import { ProductDetailPanel } from '@/components/product/ProductDetailPanel'
import { ProductForm } from '@/components/product/ProductForm'
import { ProductTypeForm } from '@/components/product/ProductTypeForm'
import { useOwners, useRenters } from '@/hooks/useContacts'
import { useProducts } from '@/hooks/useProducts'
import { useProductTypes } from '@/hooks/useProductTypes'

type AttributeDef = { key: string; label: string; type: 'text' | 'select'; options?: string[] }

export default function DashboardPage() {
  const { productTypes, refresh: refreshTypes } = useProductTypes()
  const { products, refresh: refreshProducts } = useProducts()
  const { owners } = useOwners()
  const { renters } = useRenters()

  const [typeId, setTypeId] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [attributeFilters, setAttributeFilters] = useState<Record<string, string>>({})

  // IDs, not the product objects themselves — so if a product changes (e.g. an
  // edit saved) while its panel/sheet is open, it re-derives from the live
  // `products` array below instead of rendering a stale snapshot.
  const [detailProductId, setDetailProductId] = useState<string | null>(null)
  const [atRentProductId, setAtRentProductId] = useState<string | null>(null)
  const [returnedProductId, setReturnedProductId] = useState<string | null>(null)

  const detailProduct = products.find((p) => p.id === detailProductId) ?? null
  const atRentProduct = products.find((p) => p.id === atRentProductId) ?? null
  const returnedProduct = products.find((p) => p.id === returnedProductId) ?? null

  const selectedType = productTypes.find((t) => t.id === typeId)
  const attributeDefs = (selectedType?.attribute_schema as AttributeDef[] | null) ?? []

  const attributeOptions = useMemo(() => {
    if (typeId === 'all') return []
    const productsOfType = products.filter((p) => p.product_type_id === typeId)
    return attributeDefs
      .map((def) => {
        const values = new Set<string>()
        for (const p of productsOfType) {
          const v = (p.attributes as Record<string, string> | null)?.[def.key]
          if (v) values.add(v)
        }
        return { key: def.key, label: def.label, values: Array.from(values).sort() }
      })
      .filter((opt) => opt.values.length > 0)
  }, [typeId, products, attributeDefs])

  // Everything except the status filter itself, so tab counts reflect the
  // current type/search/attribute filters without also collapsing to one status.
  const productsBeforeStatusFilter = useMemo(() => {
    return products.filter((p) => {
      if (typeId !== 'all' && p.product_type_id !== typeId) return false
      if (search && !`${p.name} ${p.code ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false
      for (const [key, value] of Object.entries(attributeFilters)) {
        if ((p.attributes as Record<string, string> | null)?.[key] !== value) return false
      }
      return true
    })
  }, [products, typeId, search, attributeFilters])

  const statusCounts = useMemo(
    () => ({
      all: productsBeforeStatusFilter.length,
      available: productsBeforeStatusFilter.filter((p) => p.status === 'available').length,
      at_rent: productsBeforeStatusFilter.filter((p) => p.status === 'at_rent').length,
    }),
    [productsBeforeStatusFilter],
  )

  const filteredProducts = useMemo(
    () => productsBeforeStatusFilter.filter((p) => status === 'all' || p.status === status),
    [productsBeforeStatusFilter, status],
  )

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <ProductTypeForm productTypes={productTypes} onCreated={refreshTypes} onDeleted={refreshTypes} />
          <ProductForm productTypes={productTypes} onCreated={refreshProducts} />
        </div>
      </div>

      <FilterBar
        productTypes={productTypes}
        typeId={typeId}
        onTypeChange={(id) => {
          setTypeId(id)
          setAttributeFilters({})
        }}
        status={status}
        onStatusChange={setStatus}
        statusCounts={statusCounts}
        attributeOptions={attributeOptions}
        attributeFilters={attributeFilters}
        onAttributeFilterChange={(key, value) =>
          setAttributeFilters((prev) => {
            const next = { ...prev }
            if (value) next[key] = value
            else delete next[key]
            return next
          })
        }
        search={search}
        onSearchChange={setSearch}
      />

      <div className="mt-4">
        {filteredProducts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {products.length === 0 ? 'No products yet — add a type, then a product.' : 'No products match these filters.'}
          </p>
        ) : (
          <ProductTable
            products={filteredProducts}
            onOpenDetail={(p) => setDetailProductId(p.id)}
            onMarkAtRent={(p) => setAtRentProductId(p.id)}
            onMarkReturned={(p) => setReturnedProductId(p.id)}
            onDeleted={refreshProducts}
          />
        )}
      </div>

      <ProductDetailPanel
        product={detailProduct}
        owners={owners}
        renters={renters}
        open={detailProductId !== null}
        onOpenChange={(open) => !open && setDetailProductId(null)}
        onChanged={refreshProducts}
      />
      <MarkAtRentSheet
        product={atRentProduct}
        open={atRentProductId !== null}
        onOpenChange={(open) => !open && setAtRentProductId(null)}
        onDone={refreshProducts}
      />
      <MarkReturnedSheet
        product={returnedProduct}
        open={returnedProductId !== null}
        onOpenChange={(open) => !open && setReturnedProductId(null)}
        onDone={refreshProducts}
      />
    </div>
  )
}
