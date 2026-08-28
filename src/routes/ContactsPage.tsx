import { ContactList } from '@/components/contacts/ContactList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useOwners, useRenters } from '@/hooks/useContacts'

export default function ContactsPage() {
  const { owners, loading: ownersLoading, refresh: refreshOwners } = useOwners()
  const { renters, loading: rentersLoading, refresh: refreshRenters } = useRenters()

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Contacts</h1>
      <Tabs defaultValue="owners">
        <TabsList>
          <TabsTrigger value="owners">Owners</TabsTrigger>
          <TabsTrigger value="renters">Renters</TabsTrigger>
        </TabsList>
        <TabsContent value="owners">
          <ContactList kind="owner" contacts={owners} loading={ownersLoading} onRefresh={refreshOwners} />
        </TabsContent>
        <TabsContent value="renters">
          <ContactList kind="renter" contacts={renters} loading={rentersLoading} onRefresh={refreshRenters} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
