import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { useAuth } from './context/useAuth'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { PacientesListPage } from './pages/PacientesListPage'
import { PacienteCreatePage } from './pages/PacienteCreatePage'
import { PacienteDetailPage } from './pages/PacienteDetailPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Loader2 } from 'lucide-react'

// Loading Screen
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 gap-3 transition-colors">
    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Carregando RMS-Nutri...</p>
  </div>
)

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public Route (redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Root Dispatcher
const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
}

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/cadastro"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            {/* Rotas de Pacientes (Prompt 4) */}
            <Route
              path="/pacientes"
              element={
                <ProtectedRoute>
                  <ErrorBoundary fallbackTitle="Erro ao carregar lista de pacientes">
                    <PacientesListPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pacientes/novo"
              element={
                <ProtectedRoute>
                  <ErrorBoundary fallbackTitle="Erro ao carregar cadastro de paciente">
                    <PacienteCreatePage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pacientes/:id"
              element={
                <ProtectedRoute>
                  <ErrorBoundary fallbackTitle="Erro ao carregar dados do paciente">
                    <PacienteDetailPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
