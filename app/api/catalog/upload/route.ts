import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) { const form = await request.formData(); const file = form.get('file'); if (!(file instanceof File)) return NextResponse.json({ error: 'File required' }, { status: 400 }); if (!['image/png', 'image/jpeg'].includes(file.type)) return NextResponse.json({ error: 'Only PNG or JPG files are allowed' }, { status: 400 }); if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Maximum size is 5MB' }, { status: 400 }); const blob = await put(`catalog/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`, file, { access: 'public', addRandomSuffix: true }); return NextResponse.json({ url: blob.url }) }
