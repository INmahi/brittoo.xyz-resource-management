import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ContactQuickAdd } from '@/components/contacts/ContactQuickAdd'
import { softDeleteContact, restoreContact, type Owner, type Renter } from '@/hooks/useContacts'
import { notifyWithUndo } from '@/lib/toastActions'

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

  async function handleDelete(id: number) {
    await softDeleteContact(kind, id)
    onRefresh()
    notifyWithUndo(`${kind === 'owner' ? 'Owner' : 'Renter'} removed`, async () => {
      await restoreContact(kind, id)
      onRefresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {adding ? (
        <ContactQuickAdd
          kind={kind}
          showProductTag
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
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  {c.notes && <Badge variant="outline">{c.notes}</Badge>}
                </div>
                <div className="flex items-center gap-3">
                  <a href={`tel:${c.phone}`} className="text-sm text-primary underline-offset-4 hover:underline">
                    {c.phone}
                  </a>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
