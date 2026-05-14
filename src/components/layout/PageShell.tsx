import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { DeepShieldLogo, IOBLogo } from '@/components/branding/BrandLogos'
import { cn } from '@/lib/utils'

interface PageShellProps {
  children: ReactNode
  dark?: boolean
  showCompactBranding?: boolean
  backTo?: string
  backLabel?: string
  rightSlot?: ReactNode
}

export function PageShell({
  children,
  dark = false,
  showCompactBranding = true,
  backTo,
  backLabel = 'Back',
  rightSlot,
}: PageShellProps) {
  return (
    <div
      className={cn(
        'min-h-screen',
        dark
          ? 'bg-slate-950 text-slate-50'
          : 'bg-gradient-to-b from-[#eef5ff] via-[#f4f8ff] to-[#edf4ff] text-slate-800'
      )}
    >
      <header
        className={cn(
          'sticky top-0 z-30 border-b backdrop-blur-xl',
          dark
            ? 'border-slate-700/70 bg-slate-900/80'
            : 'border-[#d8e4fb] bg-white/80'
        )}
      >
        <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {backTo && (
              <Link
                to={backTo}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  dark
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'bg-[#e5edff] text-[#12408f] hover:bg-[#d6e4ff]'
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            )}
            {showCompactBranding ? (
              <div className="flex items-center gap-3">
                <DeepShieldLogo compact />
                <div className={cn('h-7 w-px', dark ? 'bg-slate-700' : 'bg-[#c9d7f7]')} />
                <IOBLogo compact />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShieldCheck className={cn('h-5 w-5', dark ? 'text-cyan-300' : 'text-[#12408f]')} />
                <span className="text-sm font-semibold tracking-wide">DeepShield Platform</span>
              </div>
            )}
          </div>
          {rightSlot}
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.main>
    </div>
  )
}
