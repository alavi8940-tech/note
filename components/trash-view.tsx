'use client'

import { useState } from 'react'
import { Trash2, RotateCcw, X, Check } from 'lucide-react'
import type { Note } from '@/lib/types'
import { FONT_CLASSES } from '@/lib/types'
import { restoreNote, purgeNote } from '@/lib/use-store'
import { relativeTime } from '@/lib/date'
import { cn } from '@/lib/utils'

export function TrashView({ notes }: { notes: Note[] }) {
  const trashed = notes
    .filter((n) => n.deletedAt)
    .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-2 pt-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-nastaliq text-3xl text-foreground leading-loose">سطل زباله</h1>
          <p className="text-xs text-muted-foreground">رازهای دور ریخته شده</p>
        </div>
        {trashed.length > 0 &&
          (confirmAll ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-destructive">همه حذف شود؟</span>
              <button
                type="button"
                aria-label="تایید"
                onClick={async () => {
                  for (const n of trashed) await purgeNote(n.id)
                  setConfirmAll(false)
                }}
                className="text-destructive p-1.5"
              >
                <Check className="size-5" />
              </button>
              <button
                type="button"
                aria-label="انصراف"
                onClick={() => setConfirmAll(false)}
                className="text-muted-foreground p-1.5"
              >
                <X className="size-5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmAll(true)}
              className="text-xs text-destructive rounded-full bg-destructive/10 px-3 py-1.5"
            >
              خالی کردن
            </button>
          ))}
      </header>

      {trashed.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="ornament-border rounded-3xl bg-card p-5">
            <Trash2 className="size-10 text-gold" strokeWidth={1.5} />
          </div>
          <p className="text-muted-foreground text-sm">سطل زباله خالی است</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5 pb-4">
          {trashed.map((n) => (
            <li
              key={n.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
            >
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', FONT_CLASSES[n.font])}>
                  {n.title || 'بدون عنوان'}
                </p>
                <p className="text-xs text-muted-foreground">
                  حذف شده {n.deletedAt ? relativeTime(n.deletedAt) : ''}
                </p>
              </div>
              {confirmId === n.id ? (
                <>
                  <span className="text-xs text-destructive shrink-0">برای همیشه؟</span>
                  <button
                    type="button"
                    aria-label="تایید حذف دائمی"
                    onClick={async () => {
                      await purgeNote(n.id)
                      setConfirmId(null)
                    }}
                    className="text-destructive p-1.5"
                  >
                    <Check className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="انصراف"
                    onClick={() => setConfirmId(null)}
                    className="text-muted-foreground p-1.5"
                  >
                    <X className="size-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label="بازگردانی"
                    onClick={() => restoreNote(n)}
                    className="text-gold p-1.5"
                  >
                    <RotateCcw className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="حذف دائمی"
                    onClick={() => setConfirmId(n.id)}
                    className="text-muted-foreground p-1.5"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
