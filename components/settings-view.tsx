'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Moon,
  Sun,
  Fingerprint,
  KeyRound,
  Download,
  Upload,
  Lock,
  Type,
  ArrowDownWideNarrow,
  ShieldCheck,
} from 'lucide-react'
import type { AppSettings, NoteFont } from '@/lib/types'
import { FONT_LABELS, FONT_CLASSES } from '@/lib/types'
import { updateSettings } from '@/lib/use-store'
import { exportBackup, importBackup, type BackupData } from '@/lib/db'
import {
  biometricAvailable,
  hasBiometric,
  registerBiometric,
  removeBiometric,
  verifyPin,
  setPin,
} from '@/lib/security'
import { mutate } from 'swr'
import { toPersianDigits } from '@/lib/date'
import { cn } from '@/lib/utils'

type PinStep = 'idle' | 'current' | 'new' | 'confirm'

export function SettingsView({
  settings,
  onLockNow,
}: {
  settings: AppSettings
  onLockNow: () => void
}) {
  const [bioAvailable, setBioAvailable] = useState(false)
  const [bioEnrolled, setBioEnrolled] = useState(false)
  const [pinStep, setPinStep] = useState<PinStep>('idle')
  const [pinInput, setPinInput] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinMessage, setPinMessage] = useState<string | null>(null)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    biometricAvailable().then(setBioAvailable)
    hasBiometric().then(setBioEnrolled)
  }, [])

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    updateSettings({ ...settings, [key]: value })
  }

  async function toggleBiometric() {
    if (bioEnrolled) {
      await removeBiometric()
      setBioEnrolled(false)
    } else {
      const ok = await registerBiometric()
      setBioEnrolled(ok)
    }
  }

  async function submitPinStep() {
    if (pinInput.length < 4) return
    if (pinStep === 'current') {
      const ok = await verifyPin(pinInput)
      if (ok) {
        setPinStep('new')
        setPinMessage(null)
      } else {
        setPinMessage('رمز فعلی اشتباه است')
      }
    } else if (pinStep === 'new') {
      setNewPin(pinInput)
      setPinStep('confirm')
      setPinMessage(null)
    } else if (pinStep === 'confirm') {
      if (pinInput === newPin) {
        await setPin(pinInput)
        setPinStep('idle')
        setPinMessage('رمز با موفقیت تغییر کرد')
      } else {
        setPinMessage('رمزها یکسان نیستند')
        setPinStep('new')
      }
    }
    setPinInput('')
  }

  async function handleExport() {
    const data = await exportBackup()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daftar-raz-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setBackupMessage('فایل پشتیبان دانلود شد')
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as BackupData
      const res = await importBackup(data)
      await mutate('notes')
      await mutate('categories')
      setBackupMessage(
        `${toPersianDigits(res.notes)} یادداشت و ${toPersianDigits(res.categories)} دسته بازیابی شد`,
      )
    } catch {
      setBackupMessage('فایل پشتیبان معتبر نیست')
    }
  }

  const pinLabel =
    pinStep === 'current'
      ? 'رمز فعلی را وارد کن'
      : pinStep === 'new'
        ? 'رمز جدید (حداقل ۴ رقم)'
        : 'تکرار رمز جدید'

  return (
    <div className="flex flex-col gap-5 pb-6">
      <header className="flex flex-col gap-1 pt-2">
        <h1 className="font-nastaliq text-3xl text-foreground leading-loose">تنظیمات</h1>
        <p className="text-xs text-muted-foreground">دفترت را به سلیقه خودت کن</p>
      </header>

      {/* ظاهر */}
      <Section title="ظاهر">
        <Row
          icon={settings.theme === 'dark' ? <Moon className="size-5" /> : <Sun className="size-5" />}
          label="حالت تاریک"
        >
          <Toggle
            checked={settings.theme === 'dark'}
            onChange={(v) => set('theme', v ? 'dark' : 'light')}
            label="حالت تاریک"
          />
        </Row>
        <Row icon={<Type className="size-5" />} label="فونت پیش‌فرض یادداشت جدید">
          <div className="flex items-center gap-1.5">
            {(Object.keys(FONT_LABELS) as NoteFont[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => set('defaultFont', f)}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-xs transition-colors',
                  FONT_CLASSES[f],
                  settings.defaultFont === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground',
                )}
              >
                {FONT_LABELS[f]}
              </button>
            ))}
          </div>
        </Row>
        <Row icon={<ArrowDownWideNarrow className="size-5" />} label="مرتب‌سازی">
          <div className="flex items-center gap-1.5">
            {(
              [
                ['updated', 'آخرین ویرایش'],
                ['created', 'تاریخ ساخت'],
                ['title', 'عنوان'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => set('sortBy', key)}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-xs transition-colors',
                  settings.sortBy === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      {/* امنیت */}
      <Section title="امنیت">
        <Row icon={<Fingerprint className="size-5" />} label="قفل بیومتریک">
          {bioAvailable ? (
            <Toggle checked={bioEnrolled} onChange={toggleBiometric} label="قفل بیومتریک" />
          ) : (
            <span className="text-xs text-muted-foreground">در این دستگاه موجود نیست</span>
          )}
        </Row>
        <Row icon={<Lock className="size-5" />} label="قفل خودکار هنگام ترک اپ">
          <Toggle
            checked={settings.autoLock}
            onChange={(v) => set('autoLock', v)}
            label="قفل خودکار"
          />
        </Row>
        <div className="flex flex-col gap-3 px-4 py-3.5">
          {pinStep === 'idle' ? (
            <button
              type="button"
              onClick={() => {
                setPinStep('current')
                setPinMessage(null)
              }}
              className="flex items-center gap-3 text-sm"
            >
              <KeyRound className="size-5 text-gold" />
              تغییر رمز عبور
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">{pinLabel}</label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                      e.preventDefault()
                      submitPinStep()
                    }
                  }}
                  className="flex-1 rounded-xl bg-secondary px-3.5 py-2.5 text-sm outline-none tracking-widest"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={submitPinStep}
                  className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm"
                >
                  تایید
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPinStep('idle')
                    setPinInput('')
                    setPinMessage(null)
                  }}
                  className="text-xs text-muted-foreground px-1"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}
          {pinMessage && <p className="text-xs text-gold">{pinMessage}</p>}
        </div>
        <div className="px-4 pb-3.5">
          <button
            type="button"
            onClick={onLockNow}
            className="w-full rounded-xl bg-secondary text-secondary-foreground py-3 text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Lock className="size-4" />
            قفل کردن همین حالا
          </button>
        </div>
      </Section>

      {/* پشتیبان‌گیری */}
      <Section title="پشتیبان‌گیری">
        <div className="flex items-center gap-2 px-4 py-3.5">
          <button
            type="button"
            onClick={handleExport}
            className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Download className="size-4" />
            دریافت پشتیبان
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-xl bg-secondary text-secondary-foreground py-3 text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Upload className="size-4" />
            بازیابی پشتیبان
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImport(f)
              e.target.value = ''
            }}
          />
        </div>
        {backupMessage && <p className="text-xs text-gold px-4 pb-3">{backupMessage}</p>}
      </Section>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2">
        <ShieldCheck className="size-4 text-gold" />
        همه داده‌ها فقط روی همین دستگاه ذخیره می‌شوند
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-muted-foreground px-1">{title}</h2>
      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {children}
      </div>
    </section>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <span className="flex items-center gap-3 text-sm min-w-0">
        <span className="text-gold shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0">{children}</span>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 rounded-full transition-colors',
        checked ? 'bg-gold' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'absolute top-1 size-5 rounded-full bg-card shadow transition-all',
          checked ? 'right-6' : 'right-1',
        )}
      />
    </button>
  )
}
