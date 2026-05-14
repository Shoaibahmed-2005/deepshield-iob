import { cn } from '@/lib/utils'

interface DeepShieldLogoProps {
  compact?: boolean
  className?: string
}

interface IOBLogoProps {
  className?: string
  compact?: boolean
}

export function DeepShieldLogo({ compact = false, className }: DeepShieldLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img
        src="/brand/deepshield-mark.svg"
        alt="DeepShield logo"
        className={cn('h-12 w-12 object-contain', compact ? 'h-9 w-9' : 'h-12 w-12')}
      />
      {!compact && (
        <img
          src="/brand/deepshield-wordmark.svg"
          alt="DeepShield wordmark"
          className="h-12 w-auto object-contain"
        />
      )}
    </div>
  )
}

export function IOBLogo({ className, compact = false }: IOBLogoProps) {
  return (
    <img
      src="/brand/iob-logo.svg"
      alt="Indian Overseas Bank logo"
      className={cn('h-12 w-auto object-contain', compact ? 'h-9' : 'h-12', className)}
    />
  )
}
