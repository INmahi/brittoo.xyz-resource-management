import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const { session, signInWithPassword, signUp } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result =
      mode === 'sign-in' ? await signInWithPassword(email, password) : await signUp(email, password, fullName)
    setSubmitting(false)
    if (result.error) setError(result.error)
    else if (mode === 'sign-up') setSignedUp(true)
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Brittoo Cycle Manager</CardTitle>
          <CardDescription>
            {mode === 'sign-in' ? 'Sign in to your coordinator account.' : 'Create a coordinator account.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signedUp ? (
            <p className="text-sm text-muted-foreground">
              Account created. Check your email to confirm, then sign in.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'sign-up' && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
              </Button>
              <button
                type="button"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
                  setError(null)
                }}
              >
                {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
