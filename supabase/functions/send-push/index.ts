import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Web Push manual via Deno (sem lib externa para manter deploy simples)
// Usa a Web Crypto API nativa do Deno para assinar o JWT VAPID

const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@tatamehoje.com'

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    // Payload vem do Database Webhook: { type: 'INSERT', record: { ... } }
    const comunicado = payload.record ?? payload

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Busca subscriptions dos alunos da academia
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*, aluno:alunos!inner(academia_id, status)')
      .eq('aluno.academia_id', comunicado.academia_id)

    if (error) throw error
    if (!subs?.length) return new Response('no subscribers', { status: 200 })

    // Filtra por destinatários
    const filtrados = subs.filter((s: any) => {
      if (comunicado.destinatarios === 'todos') return true
      if (comunicado.destinatarios === 'ativos') return s.aluno.status === 'ativo'
      if (comunicado.destinatarios === 'inadimplentes') return s.aluno.status !== 'ativo'
      return true
    })

    const notifPayload = JSON.stringify({
      title: comunicado.titulo,
      body:  comunicado.mensagem.slice(0, 120),
      icon:  '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data:  { url: '/comunicados' },
    })

    const results = await Promise.allSettled(
      filtrados.map((s: any) => sendWebPush(s.endpoint, s.p256dh, s.auth, notifPayload))
    )

    const ok      = results.filter(r => r.status === 'fulfilled').length
    const failed  = results.filter(r => r.status === 'rejected').length

    // Marca como enviado
    await supabase.from('comunicados').update({ enviado_push: true }).eq('id', comunicado.id)

    return new Response(JSON.stringify({ ok, failed }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-push error:', err)
    return new Response(String(err), { status: 500 })
  }
})

// ── Web Push via VAPID ────────────────────────────────────────────────────────

async function sendWebPush(endpoint: string, p256dh: string, authKey: string, body: string) {
  const vapidHeaders = await buildVapidHeaders(endpoint)
  const encrypted    = await encryptPayload(p256dh, authKey, body)

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...vapidHeaders,
      'Content-Type':     'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'Content-Length':   String(encrypted.byteLength),
      'TTL':              '86400',
    },
    body: encrypted,
  })

  if (!resp.ok && resp.status !== 201) {
    throw new Error(`Push failed: ${resp.status} ${await resp.text()}`)
  }
}

async function buildVapidHeaders(endpoint: string) {
  const origin   = new URL(endpoint).origin
  const exp      = Math.floor(Date.now() / 1000) + 12 * 3600
  const header   = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  const claims   = b64url(JSON.stringify({ aud: origin, exp, sub: VAPID_SUBJECT }))
  const unsigned = `${header}.${claims}`

  const privKey  = await importVapidPrivateKey(VAPID_PRIVATE)
  const sig      = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privKey,
    new TextEncoder().encode(unsigned),
  )
  const jwt = `${unsigned}.${arrayToB64url(new Uint8Array(sig))}`

  return {
    Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC}`,
  }
}

async function encryptPayload(p256dhB64: string, authB64: string, plaintext: string): Promise<ArrayBuffer> {
  const p256dh   = b64urlToArray(p256dhB64)
  const authBytes = b64urlToArray(authB64)
  const plain    = new TextEncoder().encode(plaintext)

  // Generate local key pair
  const localKey = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']
  )
  const localPub = await crypto.subtle.exportKey('raw', localKey.publicKey)

  // Import receiver public key
  const receiverKey = await crypto.subtle.importKey(
    'raw', p256dh, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  )

  // ECDH shared secret
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: receiverKey }, localKey.privateKey, 256
  )

  // Salt
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // HKDF key material
  const ikm = await hkdf(
    new Uint8Array(sharedBits),
    authBytes,
    concat(
      new TextEncoder().encode('WebPush: info\0'),
      new Uint8Array(p256dh),
      new Uint8Array(localPub),
    ),
    32,
  )

  const cek = await hkdf(new Uint8Array(ikm), salt,
    new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(new Uint8Array(ikm), salt,
    new TextEncoder().encode('Content-Encoding: nonce\0'), 12)

  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey,
    concat(plain, new Uint8Array([2])), // padding delimiter
  )

  // RFC 8188 header: salt(16) + rs(4) + idlen(1) + keyid(localPub)
  const rs = new Uint8Array(4)
  new DataView(rs.buffer).setUint32(0, 4096, false)
  const idlen = new Uint8Array([localPub.byteLength])
  return concat(salt, rs, idlen, new Uint8Array(localPub), new Uint8Array(encrypted)).buffer
}

// ── Crypto helpers ────────────────────────────────────────────────────────────

async function hkdf(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8)
}

async function importVapidPrivateKey(b64: string) {
  const raw = b64urlToArray(b64)
  // Convert raw 32-byte private scalar to JWK
  const jwk = {
    kty: 'EC', crv: 'P-256',
    d:   arrayToB64url(raw),
    x: '', y: '',
    key_ops: ['sign'],
  }
  // We need to derive x,y from d — easiest: generate pair and replace d
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign'])
  const pub  = await crypto.subtle.exportKey('jwk', pair.publicKey) as any
  return crypto.subtle.importKey(
    'jwk',
    { ...pub, d: jwk.d, key_ops: ['sign'] },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign'],
  )
}

function b64url(str: string) {
  return arrayToB64url(new TextEncoder().encode(str))
}

function arrayToB64url(arr: Uint8Array) {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64urlToArray(b64: string) {
  const pad = b64.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(pad)
  return Uint8Array.from(bin, c => c.charCodeAt(0))
}

function concat(...arrays: Uint8Array[]) {
  const total = arrays.reduce((n, a) => n + a.length, 0)
  const out   = new Uint8Array(total)
  let offset  = 0
  for (const a of arrays) { out.set(a, offset); offset += a.length }
  return out
}
