'use client'

import { openDB, type IDBPDatabase } from 'idb'
import type { Note, Category, AppSettings } from './types'
import { DEFAULT_SETTINGS } from './types'

const DB_NAME = 'daftar-raz'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv')
        }
      },
    })
  }
  return dbPromise
}

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

// ---------- Notes ----------
export async function getAllNotes(): Promise<Note[]> {
  const db = await getDB()
  return db.getAll('notes')
}

export async function putNote(note: Note): Promise<void> {
  const db = await getDB()
  await db.put('notes', note)
}

export async function deleteNoteForever(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('notes', id)
}

// ---------- Categories ----------
export async function getAllCategories(): Promise<Category[]> {
  const db = await getDB()
  return db.getAll('categories')
}

export async function putCategory(cat: Category): Promise<void> {
  const db = await getDB()
  await db.put('categories', cat)
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('categories', id)
  // یادداشت‌های این دسته بدون دسته می‌شوند
  const notes: Note[] = await db.getAll('notes')
  for (const n of notes) {
    if (n.categoryId === id) {
      await db.put('notes', { ...n, categoryId: null })
    }
  }
}

// ---------- KV (settings / security) ----------
export async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await getDB()
  return db.get('kv', key)
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  const db = await getDB()
  await db.put('kv', value, key)
}

export async function kvDelete(key: string): Promise<void> {
  const db = await getDB()
  await db.delete('kv', key)
}

export async function getSettings(): Promise<AppSettings> {
  const s = await kvGet<AppSettings>('settings')
  return { ...DEFAULT_SETTINGS, ...s }
}

export async function saveSettings(s: AppSettings): Promise<void> {
  await kvSet('settings', s)
}

// ---------- Backup ----------
export interface BackupData {
  app: 'daftar-raz'
  version: 1
  exportedAt: number
  notes: Note[]
  categories: Category[]
  settings: AppSettings
}

export async function exportBackup(): Promise<BackupData> {
  const [notes, categories, settings] = await Promise.all([
    getAllNotes(),
    getAllCategories(),
    getSettings(),
  ])
  return { app: 'daftar-raz', version: 1, exportedAt: Date.now(), notes, categories, settings }
}

export async function importBackup(data: BackupData): Promise<{ notes: number; categories: number }> {
  if (data.app !== 'daftar-raz' || !Array.isArray(data.notes)) {
    throw new Error('فایل پشتیبان معتبر نیست')
  }
  const db = await getDB()
  for (const cat of data.categories ?? []) {
    await db.put('categories', cat)
  }
  for (const note of data.notes) {
    await db.put('notes', note)
  }
  return { notes: data.notes.length, categories: (data.categories ?? []).length }
}
