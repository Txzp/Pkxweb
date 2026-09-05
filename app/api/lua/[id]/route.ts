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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!/^[a-f0-9]{64}$/.test(id)) {
    return new NextResponse('Private script', { status: 404 })
  }

  const result = await db.execute<{ source: string; is_private: boolean; expires_at: Date | null }>(sql`
    SELECT source, is_private, expires_at
    FROM lua_scripts
    WHERE id = ${id}
    LIMIT 1
  `)
  const script = result.rows[0]
  if (!script || (script.expires_at && new Date(script.expires_at) < new Date())) {
    return new NextResponse('This loadstring is private.', { status: 404 })
  }

  return new NextResponse(script.is_private ? 'This loadstring is private.' : script.source, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}
