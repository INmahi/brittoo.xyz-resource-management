import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOwner, createRenter, type Owner, type Renter } from '@/hooks/useContacts'
import { notifyWithUndo } from '@/lib/toastActions'
import { supabase } from '@/lib/supabaseClient'

type Kind = 'owner' | 'renter'

export function ContactQuickAdd<K extends Kind>({
  kind,
  showProductTag = false,
  onCreated,
  onCancel,
}: {
  kind: K
  /** Only relevant from the standalone Contacts tab — when adding a contact
   * inline while creating/renting a product, the product is already named
   * in the surrounding form, so this field would be redundant. */
  showProductTag?: boolean
  onCreated: (contact: K extends 'owner' ? Owner : Renter) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [productTag, setProductTag] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Deliberately a <div>, not a <form>: this component is often embedded inside
  // another <form> (e.g. Add Product's inline "New owner"). A nested <form> lets
  // its submit event bubble into the outer form, prematurely submitting it too.
  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    const { data, error: createError } =
      kind === 'owner' ? await createOwner(name, phone, productTag) : await createRenter(name, phone, productTag)
    setSubmitting(false)
    if (createError || !data) {
      setError(createError?.message ?? 'Something went wrong')
      return
    }
    const created = data as K extends 'owner' ? Owner : Renter
    onCreated(created)
    notifyWithUndo(`${kind === 'owner' ? 'Owner' : 'Renter'} added`, async () => {
      await supabase.from(kind === 'owner' ? 'owners' : 'renters').delete().eq('id', created.id)
    })
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor={`${kind}-name`} className="sr-only">
            Name
          </Label>
          <Input id={`${kind}-name`} placeholder="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex-1">
          <Label htmlFor={`${kind}-phone`} className="sr-only">
            Phone
          </Label>
          <Input id={`${kind}-phone`} placeholder="Phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      {showProductTag && (
        <div>
          <Label htmlFor={`${kind}-product-tag`} className="sr-only">
            Product name / tag
          </Label>
          <Input
            id={`${kind}-product-tag`}
            placeholder="Product name / tag (optional)"
            value={productTag}
            onChange={(e) => setProductTag(e.target.value)}
          />
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={submitting || !name || !phone} onClick={handleSubmit}>
          {submitting ? 'Adding…' : `Add ${kind}`}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
