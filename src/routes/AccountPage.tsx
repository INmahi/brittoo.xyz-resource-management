import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'

export default function AccountPage() {
  const { user, coordinator, signOut, refreshCoordinator } = useAuth()
  const [fullName, setFullName] = useState(coordinator?.full_name ?? '')
  const [phone, setPhone] = useState(coordinator?.phone ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!coordinator) return
    setSaving(true)
    await supabase.from('coordinators').update({ full_name: fullName, phone }).eq('id', coordinator.id)
    await refreshCoordinator()
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fullName">Name</Label>
              <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button type="submit" variant="secondary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={() => void signOut()}>
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
