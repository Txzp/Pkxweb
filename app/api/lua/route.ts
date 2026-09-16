import { createHazar dsh, randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

function makeSlug(name: string, id: string) { const base = name.toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'script'; return `${base}-${id.slice(0, 8)}` }

function sessionHash(request: NextRequest, sessionId?: string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'preview-session'
  return createHash('sha256').update(`${sessionId || forwarded}:${process.env.DATABASE_URL}`).digest('hex')
}

function getSessionId(request: NextRequest) { return request.cookies.get('xfuxk_session')?.value }
function ensureSession(response: NextResponse, request: NextRequest) { if (!getSessionId(request)) { response.cookies.set('xfuxk_session', randomBytes(24).toString('hex'), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 }) } return response }

function publicOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const requestHost = forwardedHost || request.headers.get('host') || request.nextUrl.host
  const configuredHost = (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  const host = requestHost.startsWith('localhost') && configuredHost ? configuredHost : requestHost
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const protocol = forwardedProto || (host.startsWith('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = getSessionId(request)
    const session = sessionHash(request, sessionId)
    const result = await db.execute<{ id: string; name: string; visibility: 'public' | 'private'; created_at: Date }>(sql`
      SELECT id, name, slug, visibility, created_at FROM lua_scripts
      WHERE session_hash = ${session} OR visibility = 'public'
      ORDER BY created_at DESC LIMIT 50
    `)
    const origin = publicOrigin(request)
    const rows = Array.isArray(result) ? result : result.rows
    return ensureSession(NextResponse.json(rows.map((row) => ({ ...row, created_at: new Date(row.created_at).toISOString(), loadstring: `loadstring(game:HttpGet(\"${origin}/${row.slug || row.id}\"))()` })), { headers: { 'Cache-Control': 'no-store' } }), request)
  } catch { return NextResponse.json({ error: 'Unable to load feed' }, { status: 500 }) }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const source = String(body.source || '')
    const visibility = body.visibility === 'public' ? 'public' : 'private'
    if (!name || !source || name.length > 64 || source.length > 2_000_000) return NextResponse.json({ error: 'Invalid script' }, { status: 400 })
    const id = createHash('sha256').update(`${name}:${source}:${Date.now()}:${Math.random()}`).digest('hex')
    const slug = makeSlug(name, id)
    await db.execute(sql`INSERT INTO lua_scripts (id, name, slug, source, visibility, is_private, session_hash) VALUES (${id}, ${name}, ${slug}, ${source}, ${visibility}, ${visibility === 'private'}, ${sessionHash(request, getSessionId(request))})`)
    return ensureSession(NextResponse.json({ id, slug }, { status: 201 }), request)
  } catch { return NextResponse.json({ error: 'Unable to publish script' }, { status: 500 }) }
}
