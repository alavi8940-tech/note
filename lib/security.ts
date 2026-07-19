'use client'

import { kvGet, kvSet, kvDelete } from './db'
import { Capacitor } from '@capacitor/core'
import { NativeBiometric } from '@capgo/capacitor-native-biometric'

// داخل بسته بومی Capacitor (اندروید/iOS) از پلاگین بیومتریک استفاده می‌کنیم؛
// در مرورگر به WebAuthn برمی‌گردیم.
function isNative(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform()
}

// ---------- PIN (هش شده با PBKDF2) ----------

interface PinRecord {
  salt: string // base64
  hash: string // base64
  iterations: number
}

function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function b64ToBuf(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

async function derivePin(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return bufToB64(bits)
}

export async function setPin(pin: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iterations = 150_000
  const hash = await derivePin(pin, salt, iterations)
  const record: PinRecord = { salt: bufToB64(salt.buffer), hash, iterations }
  await kvSet('pin', record)
}

export async function verifyPin(pin: string): Promise<boolean> {
  const record = await kvGet<PinRecord>('pin')
  if (!record) return false
  const salt = b64ToBuf(record.salt)
  const hash = await derivePin(pin, salt, record.iterations)
  return hash === record.hash
}

export async function hasPin(): Promise<boolean> {
  return (await kvGet<PinRecord>('pin')) !== undefined
}

export async function removePin(): Promise<void> {
  await kvDelete('pin')
}

// ---------- بیومتریک ----------
// در بسته بومی Capacitor از پلاگین نیتیو، و در مرورگر از WebAuthn استفاده می‌شود.

export function biometricSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    (!!window.PublicKeyCredential || isNative()) &&
    (!!navigator.credentials || isNative())
  )
}

export async function biometricAvailable(): Promise<boolean> {
  if (isNative()) {
    try {
      const res = await NativeBiometric.isAvailable({ useFallback: true })
      return res.isAvailable
    } catch {
      return false
    }
  }
  if (!biometricSupported()) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export async function hasBiometric(): Promise<boolean> {
  return (await kvGet<boolean>('biometric-enabled')) !== undefined
}

export async function registerBiometric(): Promise<boolean> {
  if (isNative()) {
    try {
      // یک بار احراز هویت برای تایید فعال‌سازی
      await NativeBiometric.verifyIdentity({
        title: 'دفتر راز',
        subtitle: 'فعال‌سازی قفل بیومتریک',
        reason: 'برای ورود سریع با اثر انگشت یا چهره تایید کن',
        negativeButtonText: 'انصراف',
        maxAttempts: 1,
      })
      await kvSet('biometric-enabled', true)
      return true
    } catch {
      return false
    }
  }
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const userId = crypto.getRandomValues(new Uint8Array(16))
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: challenge as BufferSource,
        rp: { name: 'دفتر راز', id: window.location.hostname },
        user: {
          id: userId as BufferSource,
          name: 'daftar-raz-user',
          displayName: 'صاحب دفتر راز',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null
    if (!cred) return false
    await kvSet('biometric-cred-id', bufToB64(cred.rawId))
    await kvSet('biometric-enabled', true)
    return true
  } catch {
    return false
  }
}

export async function verifyBiometric(): Promise<boolean> {
  if (isNative()) {
    const enabled = await kvGet<boolean>('biometric-enabled')
    if (!enabled) return false
    try {
      await NativeBiometric.verifyIdentity({
        title: 'دفتر راز',
        subtitle: 'ورود به دفتر',
        reason: 'برای باز کردن قفل، خودت را تایید کن',
        negativeButtonText: 'انصراف',
        maxAttempts: 3,
      })
      return true
    } catch {
      return false
    }
  }
  try {
    const credIdB64 = await kvGet<string>('biometric-cred-id')
    if (!credIdB64) return false
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const credId = b64ToBuf(credIdB64)
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge as BufferSource,
        allowCredentials: [{ type: 'public-key', id: credId as BufferSource }],
        userVerification: 'required',
        timeout: 60_000,
      },
    })
    return assertion !== null
  } catch {
    return false
  }
}

export async function removeBiometric(): Promise<void> {
  await kvDelete('biometric-enabled')
  await kvDelete('biometric-cred-id')
}

export async function isSetupComplete(): Promise<boolean> {
  return hasPin()
}
