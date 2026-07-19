'use client'

import { Delete } from 'lucide-react'
import { toPersianDigits } from '@/lib/date'
import { cn } from '@/lib/utils'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

export function PinDots({ length, filled, error }: { length: number; filled: number; error?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3" dir="ltr">
      {Array.from({ length }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'size-3.5 rounded-full border transition-all duration-150',
            i < filled
              ? error
                ? 'bg-destructive border-destructive'
                : 'bg-gold border-gold scale-110'
              : 'border-muted-foreground/50 bg-transparent',
          )}
        />
      ))}
    </div>
  )
}

export function PinPad({
  onDigit,
  onBackspace,
  disabled,
}: {
  onDigit: (d: string) => void
  onBackspace: () => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-64 mx-auto" dir="ltr">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          disabled={disabled}
          onClick={() => onDigit(k)}
          className="h-14 rounded-2xl bg-secondary text-secondary-foreground text-xl font-medium active:scale-95 active:bg-accent transition-all disabled:opacity-50"
        >
          {toPersianDigits(k)}
        </button>
      ))}
      <span />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit('0')}
        className="h-14 rounded-2xl bg-secondary text-secondary-foreground text-xl font-medium active:scale-95 active:bg-accent transition-all disabled:opacity-50"
      >
        {toPersianDigits('0')}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onBackspace}
        aria-label="پاک کردن"
        className="h-14 rounded-2xl flex items-center justify-center text-muted-foreground active:scale-95 transition-all disabled:opacity-50"
      >
        <Delete className="size-6" />
      </button>
    </div>
  )
}
