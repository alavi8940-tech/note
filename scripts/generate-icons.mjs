// تولید آیکون‌های اندرویدی (لانچر + اسپلش) از روی icon.svg
// نیاز: sharp (همراه @capacitor/assets نصب می‌شود)
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const svgPath = resolve(root, 'public/icon.svg')
const assetsDir = resolve(root, 'assets')
mkdirSync(assetsDir, { recursive: true })

let svg = readFileSync(svgPath, 'utf8')
// پشتیبانی از prefers-color-scheme در رستر sharp نیست؛ حالت روشن را اجبار می‌کنیم
svg = svg.replace('@media (prefers-color-scheme: light)', '@media all')
svg = svg.replace('@media (prefers-color-scheme: dark)', '@media not all')

// آیکون 1024 برای @capacitor/assets
await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile(resolve(assetsDir, 'icon.png'))

// اسپلش ساده با رنگ پس‌زمینه اپ
await sharp({
  create: { width: 2732, height: 2732, channels: 4, background: '#f6efdf' },
})
  .composite([{ input: Buffer.from(svg), top: 966, left: 966, blend: 'over' }])
  .png()
  .toFile(resolve(assetsDir, 'splash.png'))

console.log('Generated: assets/icon.png (1024), assets/splash.png (2732)')
