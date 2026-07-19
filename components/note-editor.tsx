'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Heart,
  Pin,
  Trash2,
  Type,
  Palette,
  FolderOpen,
  Tag,
  Plus,
  X,
  Minus,
} from 'lucide-react'
import type { Note, Category, NoteFont, NoteColor } from '@/lib/types'
import { FONT_LABELS, FONT_CLASSES, NOTE_COLORS } from '@/lib/types'
import { updateNote, trashNote, purgeNote } from '@/lib/use-store'
import { formatPersianDateTime, toPersianDigits } from '@/lib/date'
import { cn } from '@/lib/utils'

type Panel = 'none' | 'font' | 'color' | 'category' | 'tags'

export function NoteEditor({
  note,
  categories,
  onBack,
}: {
  note: Note
  categories: Category[]
  onBack: () => void
}) {
  const [draft, setDraft] = useState<Note>(note)
  const [panel, setPanel] = useState<Panel>('none')
  const [tagInput, setTagInput] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft
  // از ذخیره مجدد در زمان unmount جلوگیری می‌کند (مثلاً بعد از انتقال به سطل زباله)
  const discarded = useRef(false)

  function isEmpty(n: Note) {
    return !n.title.trim() && !n.body.trim() && n.tags.length === 0
  }

  // ذخیره خودکار با تاخیر
  function patch(p: Partial<Note>) {
    setDraft((d) => {
      const next = { ...d, ...p }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        updateNote(next)
      }, 500)
      return next
    })
  }

  // ذخیره نهایی هنگام خروج
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (discarded.current) return
      // یادداشت خالی به‌جای ماندن در فهرست، حذف می‌شود
      if (isEmpty(draftRef.current)) {
        void purgeNote(draftRef.current.id)
        return
      }
      updateNote(draftRef.current)
    }
  }, [])

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '')
    if (!t || draft.tags.includes(t)) {
      setTagInput('')
      return
    }
    patch({ tags: [...draft.tags, t] })
    setTagInput('')
  }

  async function handleTrash() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    await trashNote(draft)
    discarded.current = true
    onBack()
  }

  const words = draft.body.trim() ? draft.body.trim().split(/\s+/).length : 0
  const colorClass = NOTE_COLORS[draft.color]?.className ?? ''

  return (
    <div className={cn('min-h-dvh flex flex-col bg-background', colorClass)}>
      {/* نوار بالا */}
      <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-2 sticky top-0 z-10 bg-inherit">
        <button
          type="button"
          onClick={onBack}
          aria-label="بازگشت"
          className="rounded-full p-2.5 bg-secondary text-secondary-foreground active:scale-95 transition-all"
        >
          <ArrowRight className="size-5" />
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="سنجاق کردن"
            onClick={() => patch({ pinned: !draft.pinned })}
            className={cn(
              'rounded-full p-2.5 transition-all active:scale-95',
              draft.pinned ? 'bg-gold/20 text-gold' : 'bg-secondary text-muted-foreground',
            )}
          >
            <Pin className={cn('size-5', draft.pinned && 'fill-gold')} />
          </button>
          <button
            type="button"
            aria-label="علاقه‌مندی"
            onClick={() => patch({ favorite: !draft.favorite })}
            className={cn(
              'rounded-full p-2.5 transition-all active:scale-95',
              draft.favorite
                ? 'bg-destructive/10 text-destructive'
                : 'bg-secondary text-muted-foreground',
            )}
          >
            <Heart className={cn('size-5', draft.favorite && 'fill-destructive')} />
          </button>
          <button
            type="button"
            aria-label="انتقال به سطل زباله"
            onClick={handleTrash}
            className="rounded-full p-2.5 bg-secondary text-muted-foreground active:scale-95 transition-all"
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </header>

      {/* بدنه ویرایشگر */}
      <div className="flex-1 flex flex-col px-5 gap-2 pb-36">
        <input
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="عنوان راز..."
          className={cn(
            'bg-transparent text-2xl font-bold outline-none placeholder:text-muted-foreground/60 py-2',
            FONT_CLASSES[draft.font],
          )}
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatPersianDateTime(draft.updatedAt)}</span>
          <span aria-hidden>·</span>
          <span>{toPersianDigits(words)} کلمه</span>
        </div>
        <textarea
          value={draft.body}
          onChange={(e) => patch({ body: e.target.value })}
          placeholder="اینجا بنویس؛ فقط خودت می‌خوانی..."
          className={cn(
            'bg-transparent flex-1 min-h-72 resize-none outline-none placeholder:text-muted-foreground/60 leading-loose mt-2',
            FONT_CLASSES[draft.font],
          )}
          style={{ fontSize: `${draft.fontSize}px` }}
        />
        {draft.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {draft.tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 text-xs rounded-full bg-accent text-accent-foreground px-2.5 py-1"
              >
                {t}
                <button
                  type="button"
                  aria-label={`حذف برچسب ${t}`}
                  onClick={() => patch({ tags: draft.tags.filter((x) => x !== t) })}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* پنل ابزار پایین */}
      <div className="fixed bottom-0 inset-x-0 bg-card border-t border-border">
        {panel === 'font' && (
          <div className="px-5 py-4 flex flex-col gap-4 border-b border-border">
            <div className="flex items-center gap-2">
              {(Object.keys(FONT_LABELS) as NoteFont[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => patch({ font: f })}
                  className={cn(
                    'flex-1 rounded-xl px-3 py-2.5 text-sm transition-colors',
                    FONT_CLASSES[f],
                    draft.font === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground',
                  )}
                >
                  {FONT_LABELS[f]}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">اندازه قلم</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="کوچک‌تر"
                 onClick={() => patch({ fontSize: Math.max(14, draft.fontSize - 2) })}
                 className="rounded-xl bg-secondary p-2 active:scale-95 transition-all"
               >
                 <Minus className="size-4" />
               </button>
               <span className="text-sm w-8 text-center">{toPersianDigits(draft.fontSize)}</span>
               <button
                 type="button"
                 aria-label="بزرگ‌تر"
                  onClick={() => patch({ fontSize: Math.min(28, draft.fontSize + 2) })}
                 className="rounded-xl bg-secondary p-2 active:scale-95 transition-all"
               >
                 <Plus className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {panel === 'color' && (
          <div className="px-5 py-4 flex items-center gap-3 border-b border-border overflow-x-auto no-scrollbar">
            {(Object.keys(NOTE_COLORS) as NoteColor[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => patch({ color: c })}
                aria-label={NOTE_COLORS[c].label}
                className={cn(
                  'size-10 shrink-0 rounded-full border-2 transition-all',
                  NOTE_COLORS[c].swatch,
                  draft.color === c ? 'border-gold scale-110' : 'border-border',
                )}
              />
            ))}
          </div>
        )}

        {panel === 'category' && (
          <div className="px-5 py-4 flex items-center gap-2 border-b border-border overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => patch({ categoryId: null })}
              className={cn(
                'shrink-0 rounded-full px-4 py-1.5 text-sm',
                draft.categoryId === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground',
              )}
            >
              بدون دسته
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => patch({ categoryId: c.id })}
                className={cn(
                  'shrink-0 rounded-full px-4 py-1.5 text-sm',
                  draft.categoryId === c.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground',
                )}
              >
                {c.name}
              </button>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                هنوز دسته‌ای نساخته‌ای؛ از تب دسته‌ها اضافه کن
              </p>
            )}
          </div>
        )}

        {panel === 'tags' && (
          <div className="px-5 py-4 flex items-center gap-2 border-b border-border">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                ) {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder="برچسب جدید..."
              className="flex-1 rounded-xl bg-secondary px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm active:scale-95 transition-all"
            >
              افزودن
            </button>
          </div>
        )}

        <div className="flex items-center justify-around px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
          <ToolButton
            icon={<Type className="size-5" />}
            label="قلم"
            active={panel === 'font'}
            onClick={() => setPanel((p) => (p === 'font' ? 'none' : 'font'))}
          />
          <ToolButton
            icon={<Palette className="size-5" />}
            label="رنگ"
            active={panel === 'color'}
            onClick={() => setPanel((p) => (p === 'color' ? 'none' : 'color'))}
          />
          <ToolButton
            icon={<FolderOpen className="size-5" />}
            label="دسته"
            active={panel === 'category'}
            onClick={() => setPanel((p) => (p === 'category' ? 'none' : 'category'))}
          />
          <ToolButton
            icon={<Tag className="size-5" />}
            label="برچسب"
            active={panel === 'tags'}
            onClick={() => setPanel((p) => (p === 'tags' ? 'none' : 'tags'))}
          />
        </div>
      </div>
    </div>
  )
}

function ToolButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-xs transition-colors',
        active ? 'text-gold' : 'text-muted-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
