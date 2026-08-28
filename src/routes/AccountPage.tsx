import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'

export default function AccountPage() {
  const { user, coordinator, signOut, refreshCoordinator } = useAuth()
  const [phone, setPhone] = useState(coordinator?.phone ?? '')
  const [saving, setSaving] = useState(false)

  async function savePhone() {
    if (!coordinator) return
    setSaving(true)
    await supabase.from('coordinators').update({ phone }).eq('id', coordinator.id)
    await refreshCoordinator()
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <p className="text-sm">{coordinator?.full_name}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <div className="flex gap-2">
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Button variant="secondary" onClick={savePhone} disabled={saving}>
                Save
              </Button>
            </div>
          </div>
          <Button variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
