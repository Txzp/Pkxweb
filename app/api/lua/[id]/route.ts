import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const id = String(body.id || '')
    const source = String(body.source || '')
    if (!/^[a-f0-9]{64}$/.test(id) || !source || source.length > 2_000_000) {
      return NextResponse.json({ error: 'Invalid script' }, { status: 400 })
    }
    await db.execute(sql`
      INSERT INTO lua_scripts (id, source, is_private)
      VALUES (${id}, ${source}, true)
      ON CONFLICT (id) DO UPDATE SET source = EXCLUDED.source
    `)
    return NextResponse.json({ id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unable to publish script' }, { status: 500 })
  }
}

function sessionHash(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'preview-session'
  return createHash('sha256').update(`${forwarded}:${process.env.DATABASE_URL}`).digest('hex')
}

async function ownsScript(request: NextRequest, id: string) {
  const result = await db.execute<{ id: string }>(sql`SELECT id FROM lua_scripts WHERE id = ${id} AND session_hash = ${sessionHash(request)} LIMIT 1`)
  return (Array.isArray(result) ? result[0] : result.rows[0])
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-f0-9]{64}$/.test(id) || !(await ownsScript(request, id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const body = await request.json()
    const source = String(body.source || '')
    if (!source.trim() || source.length > 2_000_000) return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
    await db.execute(sql`UPDATE lua_scripts SET source = ${source} WHERE id = ${id} AND session_hash = ${sessionHash(request)}`)
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Unable to update source' }, { status: 500 }) }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-f0-9]{64}$/.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    if (!name || name.length > 64) return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    const result = await db.execute(sql`UPDATE lua_scripts SET name = ${name} WHERE id = ${id} AND session_hash = ${sessionHash(request)}`)
    if (result.rowCount !== 1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Unable to rename script' }, { status: 500 }) }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-f0-9]{64}$/.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const result = await db.execute(sql`DELETE FROM lua_scripts WHERE id = ${id} AND session_hash = ${sessionHash(request)}`)
    if (result.rowCount !== 1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Unable to delete script' }, { status: 500 }) }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!/^[a-f0-9]{64}$/.test(id)) {
    return new NextResponse('Private script', { status: 404 })
  }

  if (request.nextUrl.searchParams.get('edit') === '1') {
    const owned = await db.execute<{ source: string }>(sql`SELECT source FROM lua_scripts WHERE id = ${id} AND session_hash = ${sessionHash(request)} LIMIT 1`)
    const ownRow = Array.isArray(owned) ? owned[0] : owned.rows[0]
    if (!ownRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ source: ownRow.source }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const result = await db.execute<{ source: string; is_private: boolean; expires_at: Date | null }>(sql`
    SELECT source, is_private, expires_at
    FROM lua_scripts
    WHERE id = ${id}
    LIMIT 1
  `)
  const script = Array.isArray(result) ? result[0] : result.rows[0]
  if (!script || (script.expires_at && new Date(script.expires_at) < new Date())) {
    return new NextResponse('This loadstring is private.', { status: 404 })
  }

  return new NextResponse(script.is_private ? 'loadstring("This loadstring is private.")()' : script.source, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}
