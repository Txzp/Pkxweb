import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
function session(request:NextRequest){const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||request.headers.get('x-real-ip')||'preview-session';return createHash('sha256').update(`${ip}:${process.env.DATABASE_URL}`).digest('hex')}
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){const {id}=await params;const result=await sql`SELECT title,description,key_value,theme,discord_url,expires_at FROM key_systems WHERE id=${id} AND expires_at > now() LIMIT 1`;const row=result.rows[0];if(!row)return NextResponse.json({error:'No access'},{status:404});return NextResponse.json(row,{headers:{'Cache-Control':'no-store'}})}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){const {id}=await params;await sql`DELETE FROM key_systems WHERE id=${id} AND session_hash=${session(request)}`;return NextResponse.json({ok:true})}
