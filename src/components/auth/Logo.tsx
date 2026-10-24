import React from 'react'
import { Leaf } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showSubtitle?: boolean
  className?: string
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-11 h-11 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
  }

  const iconDim = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon Badge */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-50 dark:ring-emerald-950/60`}
      >
        <Leaf className={`${iconDim[size]} stroke-[2.2]`} />
      </div>

      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`${textSizes[size]} font-extrabold tracking-tight text-slate-900 dark:text-slate-100`}
          >
            RMS<span className="text-emerald-600 dark:text-emerald-400 font-black">-Nutri</span>
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] font-medium tracking-wide uppercase text-emerald-700/80 dark:text-emerald-400/90 mt-1">
            Gestão Nutricional
          </span>
        )}
      </div>
    </div>
  )
}
