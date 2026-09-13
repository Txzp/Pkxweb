import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const upstream = await fetch(new URL(`/api/lua/${encodeURIComponent(slug)}`, request.url), {
    headers: { accept: request.headers.get('accept') || '*/*', 'x-forwarded-for': request.headers.get('x-forwarded-for') || '', 'x-real-ip': request.headers.get('x-real-ip') || '' },
    cache: 'no-store',
  })
  const body = await upstream.arrayBuffer()
  const headers = new Headers()
  for (const name of ['content-type', 'cache-control', 'x-robots-tag']) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }
  return new NextResponse(body, { status: upstream.status, headers })
}
