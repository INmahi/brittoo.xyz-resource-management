import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import AccountPage from '@/routes/AccountPage'
import ContactsPage from '@/routes/ContactsPage'
import DashboardPage from '@/routes/DashboardPage'
import LoginPage from '@/routes/LoginPage'

function App() {
  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/contacts" element={<ContactsPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App
