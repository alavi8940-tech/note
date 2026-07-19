'use client'

import { useCallback, useEffect, useState } from 'react'
import { LockScreen } from '@/components/lock-screen'
import { AppShell } from '@/components/app-shell'
import { isSetupComplete } from '@/lib/security'
import { getSettings } from '@/lib/db'

type Phase = 'loading' | 'setup' | 'locked' | 'unlocked'

export default function Page() {
  const [phase, setPhase] = useState<Phase>('loading')

  useEffect(() => {
    isSetupComplete().then((done) => {
      setPhase(done ? 'locked' : 'setup')
    })
  }, [])

  // قفل خودکار هنگام ترک اپ (در صورت فعال بودن در تنظیمات)
  useEffect(() => {
    if (phase !== 'unlocked') return
    async function onVisibility() {
      if (document.visibilityState === 'hidden') {
        const settings = await getSettings()
        if (settings.autoLock) setPhase('locked')
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [phase])

  const lockNow = useCallback(() => setPhase('locked'), [])
  const unlock = useCallback(() => setPhase('unlocked'), [])

  if (phase === 'loading') {
    return (
      <main className="min-h-dvh bg-background paper-texture flex items-center justify-center">
        <p className="font-nastaliq text-3xl text-gold leading-loose animate-pulse">دفتر راز</p>
      </main>
    )
  }

  if (phase === 'setup') {
    return <LockScreen mode="setup" onUnlock={unlock} />
  }

  if (phase === 'locked') {
    return <LockScreen mode="unlock" onUnlock={unlock} />
  }

  return <AppShell onLock={lockNow} />
}
