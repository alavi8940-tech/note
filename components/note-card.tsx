'use client'

import { Heart, Pin, Tag } from 'lucide-react'
import type { Note, Category } from '@/lib/types'
import { FONT_CLASSES, NOTE_COLORS } from '@/lib/types'
import { relativeTime } from '@/lib/date'
import { cn } from '@/lib/utils'

export function NoteCard({
  note,
  category,
  onOpen,
}: {
  note: Note
  category?: Category
  onOpen: () => void
}) {
  const colorClass = NOTE_COLORS[note.color]?.className ?? ''
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'w-full text-right rounded-2xl border border-border bg-card p-4 flex flex-col gap-2 shadow-sm active:scale-[0.98] transition-all',
        colorClass,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={cn('text-base font-semibold text-card-foreground text-balance leading-relaxed', FONT_CLASSES[note.font])}>
          {note.title || 'بدون عنوان'}
        </h3>
        <span className="flex items-center gap-1.5 shrink-0 pt-1">
          {note.pinned && <Pin className="size-4 text-gold fill-gold" />}
          {note.favorite && <Heart className="size-4 text-destructive fill-destructive" />}
        </span>
      </div>
      {note.body && (
        <p
          className={cn(
            'text-sm text-muted-foreground line-clamp-3 leading-relaxed',
            FONT_CLASSES[note.font],
          )}
        >
          {note.body}
        </p>
      )}
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="flex items-center gap-2 min-w-0">
          {category && (
            <span className="text-xs rounded-full bg-accent text-accent-foreground px-2.5 py-0.5 truncate">
              {category.name}
            </span>
          )}
          {note.tags.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
              <Tag className="size-3" />
              {note.tags.slice(0, 2).join('، ')}
              {note.tags.length > 2 ? ' …' : ''}
            </span>
          )}
        </span>
        <time className="text-xs text-muted-foreground shrink-0">{relativeTime(note.updatedAt)}</time>
      </div>
    </button>
  )
}
