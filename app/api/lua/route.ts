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
