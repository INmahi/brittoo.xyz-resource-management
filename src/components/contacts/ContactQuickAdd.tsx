import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOwner, createRenter, type Owner, type Renter } from '@/hooks/useContacts'

type Kind = 'owner' | 'renter'

export function ContactQuickAdd<K extends Kind>({
  kind,
  onCreated,
  onCancel,
}: {
  kind: K
  onCreated: (contact: K extends 'owner' ? Owner : Renter) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { data, error: createError } = kind === 'owner' ? await createOwner(name, phone) : await createRenter(name, phone)
    setSubmitting(false)
    if (createError || !data) {
      setError(createError?.message ?? 'Something went wrong')
      return
    }
    onCreated(data as K extends 'owner' ? Owner : Renter)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-md border border-border p-3">
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
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Adding…' : `Add ${kind}`}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
