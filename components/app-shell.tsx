'use client'

import { useEffect, useState } from 'react'
import { BookOpen, FolderOpen, Trash2, Settings, Plus } from 'lucide-react'
import { useNotes, useCategories, useSettings, createNote } from '@/lib/use-store'
import { NotesView } from './notes-view'
import { CategoriesView } from './categories-view'
import { TrashView } from './trash-view'
import { SettingsView } from './settings-view'
import { NoteEditor } from './note-editor'
import type { Note } from '@/lib/types'
import { DEFAULT_SETTINGS } from '@/lib/types'
import { cn } from '@/lib/utils'

type Tab = 'notes' | 'categories' | 'trash' | 'settings'

export function AppShell({ onLock }: { onLock: () => void }) {
  const { data: notes } = useNotes()
  const { data: categories } = useCategories()
  const { data: settings } = useSettings()
  const [tab, setTab] = useState<Tab>('notes')
  const [openNote, setOpenNote] = useState<Note | null>(null)

  const s = settings ?? DEFAULT_SETTINGS

  // اعمال تم تاریک/روشن
  useEffect(() => {
    document.documentElement.classList.toggle('dark', s.theme === 'dark')
    document.documentElement.classList.toggle('light', s.theme === 'light')
  }, [s.theme])

  async function handleNewNote() {
    const note = await createNote({ font: s.defaultFont })
    setOpenNote(note)
  }

  if (openNote) {
    return (
      <NoteEditor
        key={openNote.id}
        note={openNote}
        categories={categories ?? []}
        onBack={() => setOpenNote(null)}
      />
    )
  }

  const trashedCount = (notes ?? []).filter((n) => n.deletedAt).length

  return (
    <div className="min-h-dvh bg-background paper-texture flex flex-col">
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pb-28">
        {tab === 'notes' && (
          <NotesView
            notes={notes ?? []}
            categories={categories ?? []}
            settings={s}
            onOpenNote={setOpenNote}
          />
        )}
        {tab === 'categories' && (
          <CategoriesView categories={categories ?? []} notes={notes ?? []} />
        )}
        {tab === 'trash' && <TrashView notes={notes ?? []} />}
        {tab === 'settings' && <SettingsView settings={s} onLockNow={onLock} />}
      </main>

      {/* دکمه یادداشت جدید */}
      {tab === 'notes' && (
        <button
          type="button"
          onClick={handleNewNote}
          aria-label="یادداشت جدید"
          className="fixed bottom-24 left-5 z-20 size-14 rounded-2xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-all"
        >
          <Plus className="size-7" />
        </button>
      )}

      {/* ناوبری پایین */}
      <nav
        aria-label="ناوبری اصلی"
        className="fixed bottom-0 inset-x-0 z-10 bg-card/95 backdrop-blur border-t border-border"
      >
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <NavButton
            icon={<BookOpen className="size-5" />}
            label="یادداشت‌ها"
            active={tab === 'notes'}
            onClick={() => setTab('notes')}
          />
          <NavButton
            icon={<FolderOpen className="size-5" />}
            label="دسته‌ها"
            active={tab === 'categories'}
            onClick={() => setTab('categories')}
          />
          <NavButton
            icon={<Trash2 className="size-5" />}
            label="سطل زباله"
            active={tab === 'trash'}
            onClick={() => setTab('trash')}
            badge={trashedCount > 0}
          />
          <NavButton
            icon={<Settings className="size-5" />}
            label="تنظیمات"
            active={tab === 'settings'}
            onClick={() => setTab('settings')}
          />
        </div>
      </nav>
    </div>
  )
}

function NavButton({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  badge?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-[11px] transition-colors',
        active ? 'text-gold' : 'text-muted-foreground',
      )}
    >
      {badge && <span className="absolute top-0.5 left-3 size-1.5 rounded-full bg-destructive" />}
      {icon}
      {label}
    </button>
  )
}
