import React, { createContext, useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client'
import { syncNutricionista } from '../lib/db'

export interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'rms_nutri_user'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Validate and sync session on initial mount
  useEffect(() => {
    let isMounted = true

    async function checkSession() {
      try {
        const sessionRes = await authClient.getSession()
        if (sessionRes?.data?.user) {
          const u = sessionRes.data.user
          const authenticatedUser: User = {
            id: u.id,
            name: u.name || '',
            email: u.email || '',
          }
          if (isMounted) {
            setUser(authenticatedUser)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser))
          }
        } else {
          // If server says no session, clear cache
          if (isMounted) {
            setUser(null)
            localStorage.removeItem(STORAGE_KEY)
          }
        }
      } catch (err) {
        console.warn('Session verification check failed:', err)
        // Keep cached user if offline or network glitch, but stop loading
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkSession()

    return () => {
      isMounted = false
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      })

      if (response.error) {
        let errorMsg = 'E-mail ou senha incorretos. Por favor, verifique seus dados.'
        const rawErr = (response.error.message || '').toLowerCase()
        if (rawErr.includes('origin')) {
          errorMsg = 'Origem não autorizada (Trusted Domain) no Neon Auth. Verifique a configuração de domínio.'
        } else if (rawErr.includes('invalid') || rawErr.includes('credential')) {
          errorMsg = 'E-mail ou senha incorretos. Verifique suas credenciais.'
        } else if (rawErr.includes('not found')) {
          errorMsg = 'Nenhuma conta encontrada com este e-mail.'
        } else if (response.error.message) {
          errorMsg = response.error.message
        }
        return { success: false, error: errorMsg }
      }

      if (response.data?.user) {
        const u = response.data.user
        const loggedUser: User = {
          id: u.id,
          name: u.name || '',
          email: u.email || email,
        }
        setUser(loggedUser)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser))
        return { success: true }
      }

      return { success: false, error: 'Não foi possível autenticar. Tente novamente.' }
    } catch (err: unknown) {
      console.error('Login error:', err)
      const message =
        err instanceof Error ? err.message : 'Erro ao realizar login. Tente novamente mais tarde.'
      return { success: false, error: message }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanName = name.trim()

      const response = await authClient.signUp.email({
        name: cleanName,
        email: cleanEmail,
        password,
      })

      if (response.error) {
        let errorMsg = 'Erro ao criar conta. Tente novamente.'
        const rawErr = (response.error.message || '').toLowerCase()
        if (rawErr.includes('already exists') || rawErr.includes('unique') || rawErr.includes('duplicate')) {
          errorMsg = 'Já existe uma conta cadastrada com este e-mail. Faça login.'
        } else if (rawErr.includes('password') && rawErr.includes('short')) {
          errorMsg = 'A senha informada não atende aos requisitos mínimos.'
        } else if (response.error.message) {
          errorMsg = response.error.message
        }
        return { success: false, error: errorMsg }
      }

      if (response.data?.user) {
        const u = response.data.user
        const registeredUser: User = {
          id: u.id,
          name: u.name || cleanName,
          email: u.email || cleanEmail,
        }

        // Save to public.nutricionistas in Neon
        await syncNutricionista(registeredUser.id, registeredUser.name, registeredUser.email)

        setUser(registeredUser)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(registeredUser))
        return { success: true }
      }

      return { success: false, error: 'Cadastro realizado, mas não foi possível iniciar sessão.' }
    } catch (err: unknown) {
      console.error('Registration error:', err)
      const message =
        err instanceof Error ? err.message : 'Erro ao realizar cadastro. Tente novamente mais tarde.'
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      await authClient.signOut()
    } catch (err) {
      console.warn('Sign out warning:', err)
    } finally {
      setUser(null)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }

