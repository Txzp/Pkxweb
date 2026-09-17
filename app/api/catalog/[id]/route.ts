import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { createHash } from 'node:crypto'
function session(request:NextRequest){const cookie=request.cookies.get('xfuxk_session')?.value;const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||request.headers.get('x-real-ip')||'preview-session';return createHash('sha256').update(`${cookie||ip}:${process.env.DATABASE_URL}`).digest('hex')}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){const {id}=await params;const current=session(request);const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||request.headers.get('x-real-ip')||'preview-session';const legacy=createHash('sha256').update(`${ip}:${process.env.DATABASE_URL}`).digest('hex');const result=await sql`DELETE FROM published_scripts WHERE id=${id} AND owner_session IN (${current},${legacy})`;return NextResponse.json({ok:true,deleted:result.rowCount||0})}
