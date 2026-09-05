import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

function sessionHash(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'preview-session'
  return createHash('sha256').update(`${forwarded}:${process.env.DATABASE_URL}`).digest('hex')
}

export async function GET(request: NextRequest) {
  try {
    const session = sessionHash(request)
    const result = await db.execute<{ id: string; name: string; visibility: 'public' | 'private'; created_at: Date }>(sql`
      SELECT id, name, visibility, created_at FROM lua_scripts
      WHERE session_hash = ${session} OR visibility = 'public'
      ORDER BY created_at DESC LIMIT 50
    `)
    const origin = request.nextUrl.origin
    const rows = Array.isArray(result) ? result : result.rows
    return NextResponse.json(rows.map((row) => ({ ...row, created_at: new Date(row.created_at).toISOString(), loadstring: `loadstring(game:HttpGet(\"${origin}/api/lua/${row.id}\"))()` })), { headers: { 'Cache-Control': 'no-store' } })
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
    await db.execute(sql`INSERT INTO lua_scripts (id, name, source, visibility, is_private, session_hash) VALUES (${id}, ${name}, ${source}, ${visibility}, ${visibility === 'private'}, ${sessionHash(request)})`)
    return NextResponse.json({ id }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Unable to publish script' }, { status: 500 }) }
}
