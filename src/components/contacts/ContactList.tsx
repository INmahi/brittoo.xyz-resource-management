import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ContactQuickAdd } from '@/components/contacts/ContactQuickAdd'
import type { Owner, Renter } from '@/hooks/useContacts'

export function ContactList<K extends 'owner' | 'renter'>({
  kind,
  contacts,
  loading,
  onRefresh,
}: {
  kind: K
  contacts: (K extends 'owner' ? Owner : Renter)[]
  loading: boolean
  onRefresh: () => void
}) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      {adding ? (
        <ContactQuickAdd
          kind={kind}
          onCreated={() => {
            setAdding(false)
            onRefresh()
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setAdding(true)}>
          <Plus /> Add {kind}
        </Button>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {kind}s yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {contacts.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
                </div>
                <a href={`tel:${c.phone}`} className="text-sm text-primary underline-offset-4 hover:underline">
                  {c.phone}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
