import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function registrarPush(alunoId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push não suportado neste navegador')
    return false
  }
  if (!VAPID_PUBLIC_KEY) { console.warn('VAPID_PUBLIC_KEY não configurada'); return false }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const sw = await navigator.serviceWorker.ready
  const sub = await sw.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  const json = sub.toJSON()
  const keys = json.keys as { p256dh: string; auth: string }

  await db.from('push_subscriptions').upsert({
    aluno_id: alunoId,
    endpoint: sub.endpoint,
    p256dh:   keys.p256dh,
    auth:     keys.auth,
  }, { onConflict: 'aluno_id,endpoint' })

  return true
}

export async function cancelarPush(alunoId: string) {
  const sw = await navigator.serviceWorker.ready
  const sub = await sw.pushManager.getSubscription()
  if (sub) {
    await sub.unsubscribe()
    await db.from('push_subscriptions').delete()
      .eq('aluno_id', alunoId)
      .eq('endpoint', sub.endpoint)
  }
}

export async function temPushAtivo(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  try {
    const sw = await navigator.serviceWorker.ready
    const sub = await sw.pushManager.getSubscription()
    return !!sub
  } catch { return false }
}
