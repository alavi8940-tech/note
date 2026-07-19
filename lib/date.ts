export function toPersianDigits(input: string | number): string {
  const digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(input).replace(/\d/g, (d) => digits[Number(d)])
}

export function formatPersianDate(timestamp: number): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(timestamp))
}

export function formatPersianDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'همین حالا'
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${toPersianDigits(days)} روز پیش`
  return formatPersianDate(timestamp)
}
