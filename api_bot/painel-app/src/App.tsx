import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Login } from "./pages/Login"
import { DashboardLayout, UnderConstruction } from "./pages/Dashboard"
import { Settings } from "./pages/Settings"
import { useState, useEffect } from "react"
import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"

// Protected Route Component
function ProtectedRoute({ children }: { children: ReactNode }) {
  const [isValid, setIsValid] = useState<boolean | null>(null)

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("admin_auth_token")
      if (!token) {
        setIsValid(false)
        return
      }

      try {
        const response = await fetch("http://localhost:3000/api/auth/verify", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        setIsValid(response.ok)
      } catch (err) {
        setIsValid(false)
      }
    }
    verifyToken()
  }, [])

  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#000000] text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isValid) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <UnderConstruction title="Painel de Usuários" />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/settings" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
