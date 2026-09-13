import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

function sessionHash(request: NextRequest) { const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'preview-session'; return createHash('sha256').update(`${ip}:${process.env.DATABASE_URL}`).digest('hex') }
async function owned(request: NextRequest, id: string) { const result = await db.execute<{ id: string }>(sql`SELECT id FROM lua_scripts WHERE id = ${id} AND session_hash = ${sessionHash(request)} LIMIT 1`); return result.rows[0] }

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isEdit = new URL(request.url).searchParams.get('edit') === '1'
  if (isEdit) {
    if (!(await owned(request, id))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const ownedScript = await db.execute<{ source: string }>(sql`SELECT source FROM lua_scripts WHERE id = ${id} LIMIT 1`)
    return NextResponse.json({ source: ownedScript.rows[0]?.source || '' }, { headers: { 'Cache-Control': 'no-store' } })
  }
  const result = await db.execute<{ source: string; expires_at: Date | null }>(sql`SELECT source, expires_at FROM lua_scripts WHERE (id = ${id} OR slug = ${id}) LIMIT 1`)
  const script = result.rows[0]
  if (!script || (script.expires_at && new Date(script.expires_at) < new Date())) return new NextResponse(noAccessPage(), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  if ((request.headers.get('accept') || '').includes('text/html')) return new NextResponse(noAccessPage(), { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' } })
  return new NextResponse(script.source, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive' } })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; if (!(await owned(request, id))) return NextResponse.json({ error: 'Not found' }, { status: 404 }); const body = await request.json(); const name = String(body.name || '').trim(); const source = String(body.source || ''); const visibility = body.visibility === 'public' ? 'public' : 'private'; if (!name || !source.trim() || name.length > 64 || source.length > 2_000_000) return NextResponse.json({ error: 'Invalid script' }, { status: 400 }); await db.execute(sql`UPDATE lua_scripts SET name = ${name}, source = ${source}, visibility = ${visibility}, is_private = ${visibility !== 'public'} WHERE id = ${id} AND session_hash = ${sessionHash(request)}`); return NextResponse.json({ ok: true }) }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return PUT(request, { params }) }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const result = await db.execute(sql`DELETE FROM lua_scripts WHERE id = ${id} AND session_hash = ${sessionHash(request)}`); return NextResponse.json({ ok: result.rowCount === 1 }, { status: result.rowCount === 1 ? 200 : 404 }) }

function noAccessPage() { return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>No Access · xFuxk Tools</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#05070a;color:#eef2f7;font:14px Arial,sans-serif}main{width:min(420px,calc(100% - 40px));padding:42px 30px;text-align:center;border:1px solid #263241;border-radius:16px;background:#0b1017;box-shadow:0 24px 80px #000}div{height:100px;position:relative;margin:0 auto 22px;overflow:hidden;border-radius:10px;background:repeating-linear-gradient(135deg,#101b26 0 9px,#172432 9px 18px)}div:after{content:'×';position:absolute;inset:0;display:grid;place-items:center;color:#b9ff38;font-size:74px;font-weight:900;animation:pulse 1s infinite alternate}h1{margin:0 0 10px;font-size:30px;letter-spacing:-1px}p{margin:0;color:#8290a2;line-height:1.6}a{display:inline-flex;margin-top:24px;color:#fff;text-decoration:none;border:1px solid #ffffff24;border-radius:9px;padding:11px 16px;background:#ffffff0a}a:hover{background:#ffffff16}@keyframes pulse{to{transform:scale(1.08);opacity:.55}}</style></head><body><main><div></div><h1>No Access</h1><p>This script is private or the link is not available.</p><a href="/">Create Your Link ↗</a></main></body></html>` }
