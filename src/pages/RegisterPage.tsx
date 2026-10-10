import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Logo } from '../components/auth/Logo'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const validate = (): string | null => {
    if (!name.trim()) {
      return 'Por favor, preencha seu nome completo.'
    }
    if (name.trim().split(' ').length < 2) {
      return 'Por favor, insira nome e sobrenome.'
    }
    if (!email.trim()) {
      return 'Por favor, informe seu e-mail.'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return 'Por favor, forneça um endereço de e-mail válido.'
    }
    if (password.length < 9) {
      return 'A senha deve ter no mínimo 9 caracteres.'
    }
    if (password !== confirmPassword) {
      return 'As senhas informadas não coincidem.'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    const result = await register(name, email, password)
    setIsSubmitting(false)

    if (result.success) {
      navigate('/dashboard', { replace: true })
    } else {
      setError(result.error || 'Não foi possível completar o cadastro. Tente novamente.')
    }
  }

  const isPasswordMinLength = password.length >= 9
  const passwordsMatch = password.length > 0 && password === confirmPassword

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-gradient-to-b from-emerald-50/50 via-slate-50 to-emerald-50/30">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" className="mb-3" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight text-center">
            Crie sua conta profissional
          </h1>
          <p className="text-sm text-slate-500 text-center mt-1">
            Cadastre-se para gerenciar seus atendimentos com excelência
          </p>
        </div>

        {/* Register Card */}
        <Card className="p-6 sm:p-8 border-slate-200/90 shadow-xl shadow-emerald-950/5 bg-white/95 backdrop-blur-xs">
          {error && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-sm flex items-start gap-3 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Nome completo"
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Dra. Mariana Silva"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="E-mail"
              id="email"
              type="email"
              autoComplete="email"
              placeholder="mariana@nutricao.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <Input
                label="Senha"
                id="password"
                isPassword
                autoComplete="new-password"
                placeholder="Mínimo de 9 caracteres"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError(null)
                }}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              {/* Password criteria indicator */}
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1 font-medium transition-colors ${
                    isPasswordMinLength ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      isPasswordMinLength ? 'text-emerald-500' : 'text-slate-300'
                    }`}
                  />
                  Mínimo de 9 caracteres
                </span>
              </div>
            </div>

            <div>
              <Input
                label="Confirmar senha"
                id="confirmPassword"
                isPassword
                autoComplete="new-password"
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (error) setError(null)
                }}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              {confirmPassword.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 font-medium transition-colors ${
                      passwordsMatch ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        passwordsMatch ? 'text-emerald-500' : 'text-slate-300'
                      }`}
                    />
                    {passwordsMatch ? 'Senhas conferem' : 'Senhas não coincidem'}
                  </span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold shadow-emerald-600/25 mt-4"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Criar conta
            </Button>
          </form>

          {/* Footer separator & switch to login */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Já tem conta?{' '}
              <Link
                to="/login"
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors ml-1"
              >
                Faça login
              </Link>
            </p>
          </div>
        </Card>

        {/* Security Info */}
        <div className="mt-8 text-center text-xs text-slate-400">
          Ao se cadastrar, seus dados clínicos permanecem isolados e protegidos por criptografia.
        </div>
      </div>
    </div>
  )
}
