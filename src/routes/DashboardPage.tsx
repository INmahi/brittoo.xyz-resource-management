import { useMemo, useState } from 'react'

import { FilterBar, type StatusFilter } from '@/components/dashboard/FilterBar'
import { ProductCard } from '@/components/dashboard/ProductCard'
import { MarkAtRentSheet } from '@/components/product/MarkAtRentSheet'
import { MarkReturnedSheet } from '@/components/product/MarkReturnedSheet'
import { ProductDetailPanel } from '@/components/product/ProductDetailPanel'
import { ProductForm } from '@/components/product/ProductForm'
import { ProductTypeForm } from '@/components/product/ProductTypeForm'
import { useOwners, useRenters } from '@/hooks/useContacts'
import type { Product } from '@/hooks/useProducts'
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

  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [atRentProduct, setAtRentProduct] = useState<Product | null>(null)
  const [returnedProduct, setReturnedProduct] = useState<Product | null>(null)

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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (typeId !== 'all' && p.product_type_id !== typeId) return false
      if (status !== 'all' && p.status !== status) return false
      if (search && !`${p.name} ${p.code ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false
      for (const [key, value] of Object.entries(attributeFilters)) {
        if ((p.attributes as Record<string, string> | null)?.[key] !== value) return false
      }
      return true
    })
  }, [products, typeId, status, search, attributeFilters])

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <ProductTypeForm onCreated={refreshTypes} />
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

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filteredProducts.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            {products.length === 0 ? 'No products yet — add a type, then a product.' : 'No products match these filters.'}
          </p>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenDetail={setDetailProduct}
              onMarkAtRent={setAtRentProduct}
              onMarkReturned={setReturnedProduct}
            />
          ))
        )}
      </div>

      <ProductDetailPanel
        product={detailProduct}
        owners={owners}
        renters={renters}
        open={detailProduct !== null}
        onOpenChange={(open) => !open && setDetailProduct(null)}
      />
      <MarkAtRentSheet
        product={atRentProduct}
        open={atRentProduct !== null}
        onOpenChange={(open) => !open && setAtRentProduct(null)}
        onDone={refreshProducts}
      />
      <MarkReturnedSheet
        product={returnedProduct}
        open={returnedProduct !== null}
        onOpenChange={(open) => !open && setReturnedProduct(null)}
        onDone={refreshProducts}
      />
    </div>
  )
}
