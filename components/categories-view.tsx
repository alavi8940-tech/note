'use client'

import { useState } from 'react'
import { FolderOpen, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import type { Category, Note } from '@/lib/types'
import { addCategory, renameCategory, removeCategory } from '@/lib/use-store'
import { toPersianDigits } from '@/lib/date'

export function CategoriesView({
  categories,
  notes,
}: {
  categories: Category[]
  notes: Note[]
}) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function countFor(id: string) {
    return notes.filter((n) => !n.deletedAt && n.categoryId === id).length
  }

  async function handleAdd() {
    if (!newName.trim()) return
    await addCategory(newName)
    setNewName('')
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1 pt-2">
        <h1 className="font-nastaliq text-3xl text-foreground leading-loose">دسته‌ها</h1>
        <p className="text-xs text-muted-foreground">رازهایت را سازمان بده</p>
      </header>

      <div className="flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="نام دسته جدید..."
          className="flex-1 rounded-2xl bg-secondary px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={handleAdd}
          aria-label="افزودن دسته"
          className="rounded-2xl bg-primary text-primary-foreground p-3 active:scale-95 transition-all"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="ornament-border rounded-3xl bg-card p-5">
            <FolderOpen className="size-10 text-gold" strokeWidth={1.5} />
          </div>
          <p className="text-muted-foreground text-sm">هنوز دسته‌ای وجود ندارد</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5 pb-4">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
            >
              <FolderOpen className="size-5 text-gold shrink-0" />
              {editingId === c.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm border-b border-gold min-w-0"
                    autoFocus
                  />
                  <button
                    type="button"
                    aria-label="ثبت"
                    onClick={async () => {
                      if (editName.trim()) await renameCategory(c, editName)
                      setEditingId(null)
                    }}
                    className="text-gold p-1.5"
                  >
                    <Check className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="انصراف"
                    onClick={() => setEditingId(null)}
                    className="text-muted-foreground p-1.5"
                  >
                    <X className="size-5" />
                  </button>
                </>
              ) : confirmDelete === c.id ? (
                <>
                  <span className="flex-1 text-sm text-destructive">حذف شود؟</span>
                  <button
                    type="button"
                    aria-label="تایید حذف"
                    onClick={async () => {
                      await removeCategory(c.id)
                      setConfirmDelete(null)
                    }}
                    className="text-destructive p-1.5"
                  >
                    <Check className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="انصراف"
                    onClick={() => setConfirmDelete(null)}
                    className="text-muted-foreground p-1.5"
                  >
                    <X className="size-5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {toPersianDigits(countFor(c.id))} یادداشت
                  </span>
                  <button
                    type="button"
                    aria-label={`ویرایش ${c.name}`}
                    onClick={() => {
                      setEditingId(c.id)
                      setEditName(c.name)
                    }}
                    className="text-muted-foreground p-1.5"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`حذف ${c.name}`}
                    onClick={() => setConfirmDelete(c.id)}
                    className="text-muted-foreground p-1.5"
                  >
                    <Trash2 className="size-4" />
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
