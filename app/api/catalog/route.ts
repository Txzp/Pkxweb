import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { sql } from '@/lib/db'

async function ensureTable() { await sql`CREATE TABLE IF NOT EXISTS published_scripts (id text PRIMARY KEY, title text NOT NULL, thumbnail text NOT NULL, loadstring text NOT NULL, tag text, created_at timestamptz NOT NULL DEFAULT now())` }

export async function GET() { await ensureTable(); const result = await sql`SELECT id, title, thumbnail, loadstring, tag, created_at FROM published_scripts ORDER BY created_at DESC`; return NextResponse.json({ scripts: result.rows }) }

export async function POST(request: NextRequest) { await ensureTable(); const body = await request.json(); const title = String(body.title || '').trim(); const thumbnail = String(body.thumbnail || '').trim(); const loadstring = String(body.loadstring || '').trim(); const tag = String(body.tag || '').trim().slice(0, 24); if (!title || !thumbnail || !loadstring) return NextResponse.json({ error: 'Title, thumbnail and loadstring are required' }, { status: 400 }); if (!/^https?:\/\//.test(thumbnail)) return NextResponse.json({ error: 'Invalid thumbnail URL' }, { status: 400 }); const id = createHash('sha256').update(`${title}:${loadstring}:${Date.now()}`).digest('hex').slice(0, 16); await sql`INSERT INTO published_scripts (id, title, thumbnail, loadstring, tag) VALUES (${id}, ${title}, ${thumbnail}, ${loadstring}, ${tag || null})`; return NextResponse.json({ id }, { status: 201 }) }
