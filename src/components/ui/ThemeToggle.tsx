import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/useTheme'
import { cn } from '../../utils/cn'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md'
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className={cn(
        'relative inline-flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer select-none',
        'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-600 shadow-2xs',
        size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm',
        className
      )}
    >
      {isDark ? (
        <Sun className={cn('animate-in spin-in-90 duration-300 text-amber-400', size === 'sm' ? 'w-4 h-4' : 'w-4 h-4')} />
      ) : (
        <Moon className={cn('animate-in -spin-in-90 duration-300 text-slate-600', size === 'sm' ? 'w-4 h-4' : 'w-4 h-4')} />
      )}
    </button>
  )
}
