export type NoteFont = 'vazir' | 'uthman' | 'nastaliq'

export type NoteColor =
  | 'default'
  | 'cream'
  | 'rose'
  | 'sage'
  | 'sky'
  | 'amber'

export interface Note {
  id: string
  title: string
  body: string
  font: NoteFont
  fontSize: number // 14 - 28
  color: NoteColor
  categoryId: string | null
  tags: string[]
  favorite: boolean
  pinned: boolean
  createdAt: number
  updatedAt: number
  deletedAt: number | null // در سطل زباله
}

export interface Category {
  id: string
  name: string
  createdAt: number
}

export interface AppSettings {
  theme: 'light' | 'dark'
  defaultFont: NoteFont
  autoLock: boolean // قفل خودکار هنگام ترک اپ
  sortBy: 'updated' | 'created' | 'title'
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  defaultFont: 'vazir',
  autoLock: true,
  sortBy: 'updated',
}

export const FONT_LABELS: Record<NoteFont, string> = {
  vazir: 'وزیرمتن',
  uthman: 'عثمان طه',
  nastaliq: 'نستعلیق',
}

export const FONT_CLASSES: Record<NoteFont, string> = {
  vazir: 'font-sans',
  uthman: 'font-quran',
  nastaliq: 'font-nastaliq',
}

export const NOTE_COLORS: Record<NoteColor, { label: string; className: string; swatch: string }> = {
  default: { label: 'پیش‌فرض', className: '', swatch: 'bg-card border-border' },
  cream: {
    label: 'کاهی',
    className: 'bg-[oklch(0.93_0.04_88)] dark:bg-[oklch(0.27_0.03_80)]',
    swatch: 'bg-[oklch(0.93_0.04_88)] dark:bg-[oklch(0.27_0.03_80)]',
  },
  rose: {
    label: 'گلگون',
    className: 'bg-[oklch(0.92_0.03_20)] dark:bg-[oklch(0.27_0.03_20)]',
    swatch: 'bg-[oklch(0.92_0.03_20)] dark:bg-[oklch(0.27_0.03_20)]',
  },
  sage: {
    label: 'مریم‌گلی',
    className: 'bg-[oklch(0.92_0.03_140)] dark:bg-[oklch(0.27_0.03_140)]',
    swatch: 'bg-[oklch(0.92_0.03_140)] dark:bg-[oklch(0.27_0.03_140)]',
  },
  sky: {
    label: 'فیروزه‌ای',
    className: 'bg-[oklch(0.92_0.03_220)] dark:bg-[oklch(0.27_0.03_220)]',
    swatch: 'bg-[oklch(0.92_0.03_220)] dark:bg-[oklch(0.27_0.03_220)]',
  },
  amber: {
    label: 'عنابی',
    className: 'bg-[oklch(0.9_0.05_60)] dark:bg-[oklch(0.28_0.04_50)]',
    swatch: 'bg-[oklch(0.9_0.05_60)] dark:bg-[oklch(0.28_0.04_50)]',
  },
}
