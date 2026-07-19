'use client'

import { useCallback, useEffect, useState } from 'react'
import { Fingerprint, BookLock, ShieldCheck } from 'lucide-react'
import { PinPad, PinDots } from './pin-pad'
import {
  verifyPin,
  setPin,
  verifyBiometric,
  registerBiometric,
  biometricAvailable,
  hasBiometric,
} from '@/lib/security'

const PIN_LENGTH = 4

type SetupStep = 'enter' | 'confirm' | 'biometric'

export function LockScreen({
  mode,
  onUnlock,
}: {
  mode: 'setup' | 'unlock'
  onUnlock: () => void
}) {
  const [pin, setPinValue] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [setupStep, setSetupStep] = useState<SetupStep>('enter')
  const [firstPin, setFirstPin] = useState('')
  const [bioAvailable, setBioAvailable] = useState(false)
  const [bioEnrolled, setBioEnrolled] = useState(false)

  useEffect(() => {
    biometricAvailable().then(setBioAvailable)
    hasBiometric().then(setBioEnrolled)
  }, [])

  const tryBiometric = useCallback(async () => {
    setBusy(true)
    const ok = await verifyBiometric()
    setBusy(false)
    if (ok) onUnlock()
  }, [onUnlock])

  // در حالت باز کردن، اگر بیومتریک فعال است خودکار درخواست بده
  useEffect(() => {
    if (mode === 'unlock' && bioEnrolled) {
      const t = setTimeout(() => {
        tryBiometric()
      }, 400)
      return () => clearTimeout(t)
    }
  }, [mode, bioEnrolled, tryBiometric])

  async function handleComplete(entered: string) {
    if (mode === 'unlock') {
      setBusy(true)
      const ok = await verifyPin(entered)
      setBusy(false)
      if (ok) {
        onUnlock()
      } else {
        setError(true)
        setTimeout(() => {
          setError(false)
          setPinValue('')
        }, 600)
      }
      return
    }
    // setup
    if (setupStep === 'enter') {
      setFirstPin(entered)
      setPinValue('')
      setSetupStep('confirm')
    } else if (setupStep === 'confirm') {
      if (entered === firstPin) {
        setBusy(true)
        await setPin(entered)
        setBusy(false)
        if (bioAvailable) {
          setSetupStep('biometric')
        } else {
          onUnlock()
        }
      } else {
        setError(true)
        setTimeout(() => {
          setError(false)
          setPinValue('')
          setFirstPin('')
          setSetupStep('enter')
        }, 700)
      }
    }
  }

  function onDigit(d: string) {
    if (busy || pin.length >= PIN_LENGTH) return
    const next = pin + d
    setPinValue(next)
    if (next.length === PIN_LENGTH) {
      handleComplete(next)
    }
  }

  async function enrollBiometric() {
    setBusy(true)
    await registerBiometric()
    setBusy(false)
    onUnlock()
  }

  const title =
    mode === 'unlock'
      ? 'دفتر راز'
      : setupStep === 'enter'
        ? 'یک رمز برای دفترت انتخاب کن'
        : setupStep === 'confirm'
          ? 'رمز را دوباره وارد کن'
          : 'قفل بیومتریک'

  const subtitle =
    mode === 'unlock'
      ? error
        ? 'رمز اشتباه است'
        : 'برای ورود، رمز خود را وارد کنید'
      : setupStep === 'enter'
        ? 'این رمز کلید ورود به رازهای توست'
        : setupStep === 'confirm'
          ? error
            ? 'رمزها یکسان نبودند، از اول شروع کن'
            : 'برای اطمینان یک بار دیگر'
          : 'می‌خواهی با اثر انگشت یا چهره هم باز شود؟'

  return (
    <main className="min-h-dvh bg-background paper-texture flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="ornament-border rounded-3xl bg-card p-5 shadow-sm">
            <BookLock className="size-12 text-gold" strokeWidth={1.5} />
          </div>
          <h1 className="font-nastaliq text-4xl text-foreground text-balance leading-loose">
            {title}
          </h1>
          <p
            className={
              error ? 'text-destructive text-sm' : 'text-muted-foreground text-sm text-pretty'
            }
          >
            {subtitle}
          </p>
        </div>

        {setupStep === 'biometric' && mode === 'setup' ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <button
              type="button"
              onClick={enrollBiometric}
              disabled={busy}
              className="flex items-center gap-3 rounded-2xl bg-primary text-primary-foreground px-6 py-4 w-full justify-center active:scale-95 transition-all disabled:opacity-60"
            >
              <Fingerprint className="size-6" />
              <span>فعال‌سازی بیومتریک</span>
            </button>
            <button
              type="button"
              onClick={onUnlock}
              className="text-muted-foreground text-sm py-2"
            >
              فعلاً نه، فقط رمز کافی است
            </button>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-gold" />
              همه‌چیز فقط روی همین دستگاه می‌ماند
            </p>
          </div>
        ) : (
          <>
            <PinDots length={PIN_LENGTH} filled={pin.length} error={error} />
            <PinPad
              onDigit={onDigit}
              onBackspace={() => setPinValue((p) => p.slice(0, -1))}
              disabled={busy}
            />
            {mode === 'unlock' && bioEnrolled && (
              <button
                type="button"
                onClick={tryBiometric}
                disabled={busy}
                className="flex items-center gap-2 text-gold text-sm py-2 active:scale-95 transition-all"
              >
                <Fingerprint className="size-5" />
                باز کردن با اثر انگشت / چهره
              </button>
            )}
          </>
        )}
      </div>
    </main>
  )
}
