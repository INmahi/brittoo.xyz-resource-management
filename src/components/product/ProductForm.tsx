import { Plus } from 'lucide-react'
import { useState } from 'react'

import { ContactQuickAdd } from '@/components/contacts/ContactQuickAdd'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useOwners } from '@/hooks/useContacts'
import type { ProductType } from '@/hooks/useProductTypes'
import { supabase } from '@/lib/supabaseClient'
import { notifyWithUndo } from '@/lib/toastActions'

type AttributeDef = { key: string; label: string; type: 'text' | 'select'; options?: string[] }

export function ProductForm({ productTypes, onCreated }: { productTypes: ProductType[]; onCreated: () => void }) {
  const { owners, refresh: refreshOwners } = useOwners()
  const [open, setOpen] = useState(false)
  const [typeId, setTypeId] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [station, setStation] = useState('')
  const [ownerMode, setOwnerMode] = useState<'saved' | 'temporary'>('saved')
  const [ownerId, setOwnerId] = useState('')
  const [addingOwner, setAddingOwner] = useState(false)
  const [tempOwnerName, setTempOwnerName] = useState('')
  const [tempOwnerPhone, setTempOwnerPhone] = useState('')
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const selectedType = productTypes.find((t) => t.id === typeId)
  const attributeDefs = (selectedType?.attribute_schema as AttributeDef[] | null) ?? []

  function reset() {
    setTypeId('')
    setName('')
    setCode('')
    setStation('')
    setOwnerMode('saved')
    setOwnerId('')
    setTempOwnerName('')
    setTempOwnerPhone('')
    setAttributeValues({})
    setError(null)
    setAddingOwner(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!typeId || !name) {
      setError('Type and name are required.')
      return
    }
    setError(null)
    setSubmitting(true)

    const { data: inserted, error: insertError } = await supabase
      .from('products')
      .insert({
        product_type_id: typeId,
        name,
        code: code || null,
        current_station: station || null,
        current_owner_id: ownerMode === 'saved' && ownerId ? Number(ownerId) : null,
        temp_owner_name: ownerMode === 'temporary' ? tempOwnerName || null : null,
        temp_owner_phone: ownerMode === 'temporary' ? tempOwnerPhone || null : null,
        attributes: attributeValues,
      })
      .select('id')
      .single()

    setSubmitting(false)
    if (insertError || !inserted) {
      setError(insertError?.message ?? 'Something went wrong')
      return
    }

    reset()
    setOpen(false)
    onCreated()
    notifyWithUndo(`${name} added`, async () => {
      await supabase.from('products').delete().eq('id', inserted.id)
      onCreated()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Add Product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>Register a new unit under an existing product type.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select
              value={typeId}
              onValueChange={(v) => {
                setTypeId(v)
                setAttributeValues({})
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {productTypes.map((pt) => (
                  <SelectItem key={pt.id} value={pt.id}>
                    {pt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-name">Name</Label>
            <Input id="product-name" placeholder="e.g. Ladies Cycle #3" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-code">Code (optional)</Label>
            <Input id="product-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>

          {attributeDefs.map((attr) => (
            <div key={attr.key} className="flex flex-col gap-1.5">
              <Label htmlFor={`attr-${attr.key}`}>{attr.label}</Label>
              {attr.type === 'select' ? (
                <Select
                  value={attributeValues[attr.key] ?? ''}
                  onValueChange={(v) => setAttributeValues((prev) => ({ ...prev, [attr.key]: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${attr.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(attr.options ?? []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`attr-${attr.key}`}
                  value={attributeValues[attr.key] ?? ''}
                  onChange={(e) => setAttributeValues((prev) => ({ ...prev, [attr.key]: e.target.value }))}
                />
              )}
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-station">Initial station</Label>
            <Input id="product-station" value={station} onChange={(e) => setStation(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Owner</Label>
            <Tabs value={ownerMode} onValueChange={(v) => setOwnerMode(v as 'saved' | 'temporary')}>
              <TabsList>
                <TabsTrigger value="saved">Saved contact</TabsTrigger>
                <TabsTrigger value="temporary">Temporary</TabsTrigger>
              </TabsList>
              <TabsContent value="saved">
                {addingOwner ? (
                  <ContactQuickAdd
                    kind="owner"
                    onCreated={(owner) => {
                      refreshOwners()
                      setOwnerId(String(owner.id))
                      setAddingOwner(false)
                    }}
                    onCancel={() => setAddingOwner(false)}
                  />
                ) : (
                  <div className="flex gap-2">
                    <Select value={ownerId} onValueChange={setOwnerId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {owners.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.name} · {o.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => setAddingOwner(true)}>
                      New
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="temporary">
                <div className="flex gap-2">
                  <Input placeholder="Name" value={tempOwnerName} onChange={(e) => setTempOwnerName(e.target.value)} />
                  <Input placeholder="Phone" value={tempOwnerPhone} onChange={(e) => setTempOwnerPhone(e.target.value)} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Not saved as a contact — just attached to this product.</p>
              </TabsContent>
            </Tabs>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={submitting || !typeId}>
              {submitting ? 'Saving…' : 'Create product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
