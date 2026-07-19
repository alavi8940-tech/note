'use client'

import useSWR, { mutate } from 'swr'
import {
  getAllNotes,
  getAllCategories,
  getSettings,
  putNote,
  putCategory,
  deleteCategory as dbDeleteCategory,
  deleteNoteForever,
  saveSettings,
  uid,
} from './db'
import type { Note, Category, AppSettings, NoteFont } from './types'

export function useNotes() {
  return useSWR<Note[]>('notes', getAllNotes)
}

export function useCategories() {
  return useSWR<Category[]>('categories', getAllCategories)
}

export function useSettings() {
  return useSWR<AppSettings>('settings', getSettings)
}

export async function createNote(defaults: { font: NoteFont; categoryId?: string | null }): Promise<Note> {
  const now = Date.now()
  const note: Note = {
    id: uid(),
    title: '',
    body: '',
    font: defaults.font,
    fontSize: 18,
    color: 'default',
    categoryId: defaults.categoryId ?? null,
    tags: [],
    favorite: false,
    pinned: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  await putNote(note)
  await mutate('notes')
  return note
}

export async function updateNote(note: Note): Promise<void> {
  await putNote({ ...note, updatedAt: Date.now() })
  await mutate('notes')
}

export async function toggleNoteFlag(note: Note, flag: 'favorite' | 'pinned'): Promise<void> {
  await putNote({ ...note, [flag]: !note[flag] })
  await mutate('notes')
}

export async function trashNote(note: Note): Promise<void> {
  await putNote({ ...note, deletedAt: Date.now(), pinned: false })
  await mutate('notes')
}

export async function restoreNote(note: Note): Promise<void> {
  await putNote({ ...note, deletedAt: null })
  await mutate('notes')
}

export async function purgeNote(id: string): Promise<void> {
  await deleteNoteForever(id)
  await mutate('notes')
}

export async function addCategory(name: string): Promise<Category> {
  const cat: Category = { id: uid(), name: name.trim(), createdAt: Date.now() }
  await putCategory(cat)
  await mutate('categories')
  return cat
}

export async function renameCategory(cat: Category, name: string): Promise<void> {
  await putCategory({ ...cat, name: name.trim() })
  await mutate('categories')
}

export async function removeCategory(id: string): Promise<void> {
  await dbDeleteCategory(id)
  await mutate('categories')
  await mutate('notes')
}

export async function updateSettings(s: AppSettings): Promise<void> {
  await saveSettings(s)
  await mutate('settings')
}
