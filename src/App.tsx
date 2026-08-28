import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Brittoo Cycle Manager</CardTitle>
          <CardDescription>Scaffolding is up. Dashboard, auth, and product screens land in Phase 1.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>It works</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
