import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Logo } from '../components/auth/Logo'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ThemeToggle } from '../components/ui/ThemeToggle'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail institucional ou pessoal.')
      return
    }

    if (!password) {
      setError('Por favor, informe sua senha.')
      return
    }

    setIsSubmitting(true)
    const result = await login(email, password)
    setIsSubmitting(false)

    if (result.success) {
      navigate('/dashboard', { replace: true })
    } else {
      setError(result.error || 'Falha ao autenticar. Verifique suas informações.')
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-gradient-to-b from-emerald-50/50 via-slate-50 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 transition-colors">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" className="mb-3" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight text-center">
            Bem-vindo(a) de volta
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
            Acesse seu painel clínico e gerencie seus pacientes
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 sm:p-8 border-slate-200/90 dark:border-slate-800 shadow-xl shadow-emerald-950/5 dark:shadow-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs">
          {error && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200/80 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="E-mail"
              id="email"
              type="email"
              autoComplete="email"
              placeholder="exemplo@nutricao.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Senha"
              id="password"
              isPassword
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(null)
              }}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold shadow-emerald-600/25 mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Entrar
            </Button>
          </form>

          {/* Footer separator & switch to register */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Não tem conta?{' '}
              <Link
                to="/cadastro"
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors ml-1"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </Card>

        {/* Feature Highlights / Security Badge */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Dados protegidos por RLS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Neon Serverless Auth</span>
          </div>
        </div>
      </div>
    </div>
  )
}
