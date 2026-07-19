'use client'

import { useMemo, useState } from 'react'
import { Search, Heart, BookOpen, X } from 'lucide-react'
import type { Note, Category, AppSettings } from '@/lib/types'
import { NoteCard } from './note-card'
import { toPersianDigits } from '@/lib/date'
import { cn } from '@/lib/utils'

export function NotesView({
  notes,
  categories,
  settings,
  onOpenNote,
}: {
  notes: Note[]
  categories: Category[]
  settings: AppSettings
  onOpenNote: (note: Note) => void
}) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const visible = useMemo(() => {
    let list = notes.filter((n) => !n.deletedAt)
    if (favoritesOnly) list = list.filter((n) => n.favorite)
    if (activeCategory) list = list.filter((n) => n.categoryId === activeCategory)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }
    const sorted = [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      if (settings.sortBy === 'title') return a.title.localeCompare(b.title, 'fa')
      if (settings.sortBy === 'created') return b.createdAt - a.createdAt
      return b.updatedAt - a.updatedAt
    })
    return sorted
  }, [notes, query, activeCategory, favoritesOnly, settings.sortBy])

  const totalActive = notes.filter((n) => !n.deletedAt).length

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1 pt-2">
        <h1 className="font-nastaliq text-3xl text-foreground leading-loose">دفتر راز</h1>
        <p className="text-xs text-muted-foreground">
          {toPersianDigits(totalActive)} یادداشت در دفتر شما
        </p>
      </header>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 rounded-2xl bg-secondary px-3.5 py-2.5">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در رازها..."
            className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground min-w-0"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="پاک کردن جستجو">
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setFavoritesOnly((v) => !v)}
          aria-pressed={favoritesOnly}
          aria-label="فقط علاقه‌مندی‌ها"
          className={cn(
            'rounded-2xl p-2.5 transition-colors',
            favoritesOnly
              ? 'bg-destructive/10 text-destructive'
              : 'bg-secondary text-muted-foreground',
          )}
        >
          <Heart className={cn('size-5', favoritesOnly && 'fill-destructive')} />
        </button>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors',
              activeCategory === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground',
            )}
          >
            همه
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory((cur) => (cur === c.id ? null : c.id))}
              className={cn(
                'shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors',
                activeCategory === c.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="ornament-border rounded-3xl bg-card p-5">
            <BookOpen className="size-10 text-gold" strokeWidth={1.5} />
          </div>
          <p className="text-muted-foreground text-sm text-pretty">
            {query || activeCategory || favoritesOnly
              ? 'چیزی پیدا نشد'
              : 'دفترت هنوز خالی است؛ اولین رازت را بنویس'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-4">
          {visible.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              category={n.categoryId ? catMap.get(n.categoryId) : undefined}
              onOpen={() => onOpenNote(n)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
