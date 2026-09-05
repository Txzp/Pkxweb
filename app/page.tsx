'use client'

import { useEffect, useState } from 'react'
import { Check, Code2, Copy, Eye, FileCode2, LockKeyhole, Pencil, Plus, Snowflake, Trash2, Upload, X } from 'lucide-react'

type Script = { id: string; name: string; visibility: 'public' | 'private'; created_at: string; loadstring: string }

const sample = `local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
    print("Welcome, " .. player.Name)
end)`

export default function Page() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [name, setName] = useState('')
  const [source, setSource] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('private')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [editing, setEditing] = useState<Script | null>(null)
  const [editSource, setEditSource] = useState('')
  const [editBusy, setEditBusy] = useState(false)

  const loadFeed = async () => {
    const response = await fetch('/api/lua', { cache: 'no-store' })
    if (response.ok) setScripts(await response.json())
  }
  useEffect(() => { loadFeed() }, [])

  const publish = async () => {
    if (!name.trim() || !source.trim()) return setMessage('Add a name and source first')
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/lua', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, source, visibility }) })
      if (!response.ok) throw new Error()
      setName(''); setSource(''); setVisibility('private'); setMessage('Script published')
      await loadFeed()
    } catch { setMessage('Could not publish script') } finally { setBusy(false) }
  }
  const copy = async (script: Script) => {
    await navigator.clipboard.writeText(script.loadstring)
    setCopied(script.id); window.setTimeout(() => setCopied(null), 1500)
  }
  const rename = async (script: Script) => {
    const nextName = window.prompt('Rename script', script.name)?.trim()
    if (!nextName || nextName === script.name) return
    const response = await fetch(`/api/lua/${script.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nextName }) })
    if (response.ok) await loadFeed()
  }
  const remove = async (script: Script) => {
    if (!window.confirm(`Delete ${script.name}?`)) return
    const response = await fetch(`/api/lua/${script.id}`, { method: 'DELETE' })
    if (response.ok) await loadFeed()
  }
  const openEditor = async (script: Script) => {
    const response = await fetch(`/api/lua/${script.id}?edit=1`, { cache: 'no-store' })
    if (!response.ok) return setMessage('Only scripts from this session can be edited')
    const data = await response.json()
    setEditing(script); setEditSource(data.source)
  }
  const saveEditor = async () => {
    if (!editing || !editSource.trim()) return
    setEditBusy(true)
    const response = await fetch(`/api/lua/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: editSource }) })
    setEditBusy(false)
    if (response.ok) { setEditing(null); await loadFeed(); setMessage('Source updated') } else setMessage('Could not update source')
  }

  return <main className="min-h-screen overflow-hidden bg-background text-foreground">
    <Snow />
    <div className="relative z-10 mx-auto min-h-screen max-w-5xl px-5 py-8 sm:px-8">
      <div className="mb-12 flex items-center justify-between"><div className="flex items-center gap-3"><div className="logo-mark">xF</div><span className="font-mono text-sm font-bold tracking-tight">xFuxk Load</span></div><span className="session-label">private session</span></div>
      <section className="mb-9"><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">roblox lua library</p><h1 className="max-w-2xl text-balance font-mono text-4xl font-bold tracking-[-0.06em] sm:text-6xl">Publish once.<br /><span className="text-primary">Load anywhere.</span></h1><p className="mt-5 max-w-lg text-sm leading-6 text-muted-foreground">Store your Roblox scripts behind a clean loadstring. Your feed is isolated to your private session.</p></section>
      <section className="composer panel mb-10"><div className="panel-top"><span className="flex items-center gap-2"><Plus size={15} /> new script</span><span className="font-mono text-[10px] text-muted-foreground">source.lua</span></div><div className="grid gap-4 p-4 sm:grid-cols-[220px_1fr]"><div className="flex flex-col gap-3"><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Script name" maxLength={64} /><div className="visibility"><button className={visibility === 'private' ? 'active' : ''} onClick={() => setVisibility('private')}><LockKeyhole size={14} /> Private</button><button className={visibility === 'public' ? 'active' : ''} onClick={() => setVisibility('public')}><Eye size={14} /> Public</button></div><button className="publish-button" onClick={publish} disabled={busy}><Upload size={15} /> {busy ? 'Publishing...' : 'Publish script'}</button>{message && <p className="font-mono text-[10px] text-primary">{message}</p>}</div><div className="source-box"><textarea value={source} onChange={(e) => setSource(e.target.value)} spellCheck={false} placeholder="Paste your Roblox Lua script here..." aria-label="source.lua" /><div className="source-footer"><button onClick={() => setSource(sample)} className="text-link">load example</button><span>{source.length.toLocaleString()} chars</span></div></div></div></section>
      <section><div className="mb-4 flex items-center justify-between"><div><p className="font-mono text-xs font-bold">your scripts</p><p className="mt-1 text-xs text-muted-foreground">Only scripts from this session appear here.</p></div><span className="count-pill">{scripts.length} scripts</span></div><div className="feed">{scripts.length === 0 ? <div className="empty-state"><FileCode2 size={22} /><p>No scripts published yet.</p></div> : scripts.map((script) => <article className="script-card" key={script.id}><div className="flex min-w-0 items-center gap-3"><div className="file-icon"><FileCode2 size={16} /></div><div className="min-w-0"><h2 className="truncate text-sm font-semibold">{script.name}</h2><p className="mt-1 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">{script.visibility === 'private' ? <><LockKeyhole size={11} /> private</> : <><Eye size={11} /> public</>} · {new Date(script.created_at).toLocaleString()}</p></div></div><div className="flex items-center gap-2"><button aria-label={`Copy loadstring for ${script.name}`} title="Copy loadstring" className="icon-button" onClick={() => copy(script)}>{copied === script.id ? <Check size={14} /> : <Copy size={14} />}</button><button aria-label={`Edit code for ${script.name}`} title="Edit code" className="icon-button" onClick={() => openEditor(script)}><Code2 size={14} /></button><button aria-label={`Rename ${script.name}`} title="Rename" className="icon-button" onClick={() => rename(script)}><Pencil size={14} /></button><button aria-label={`Delete ${script.name}`} title="Delete" className="icon-button danger" onClick={() => remove(script)}><Trash2 size={14} /></button></div></article>)}</div></section>
      <footer className="mt-16 flex items-center justify-between border-t border-border/70 py-5 font-mono text-[10px] text-muted-foreground"><span>xFuxk Load</span><span className="flex items-center gap-2"><Snowflake size={12} /> session scoped</span></footer>
    </div>
    {editing && <div className="editor-overlay" role="dialog" aria-modal="true" aria-label={`Edit ${editing.name}`}><div className="editor-modal"><div className="editor-header"><div><p className="font-mono text-xs font-bold">{editing.name}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">source.lua · {editSource.split('\\n').length} lines</p></div><button className="icon-button" onClick={() => setEditing(null)} aria-label="Close editor"><X size={16} /></button></div><div className="code-editor"><div className="line-numbers" aria-hidden="true">{editSource.split('\\n').map((_, index) => <span key={index}>{index + 1}</span>)}</div><textarea value={editSource} onChange={(event) => setEditSource(event.target.value)} spellCheck={false} aria-label="Lua source editor" /></div><div className="editor-footer"><span className="font-mono text-[10px] text-muted-foreground">{editSource.length.toLocaleString()} chars</span><button className="publish-button" onClick={saveEditor} disabled={editBusy}>{editBusy ? 'Saving...' : 'Save source'}</button></div></div></div>}
  </main>
}

function Snow() { return <div className="snow" aria-hidden="true">{Array.from({ length: 34 }, (_, i) => <i key={i} style={{ left: `${(i * 29) % 100}%`, animationDelay: `${(i * 0.37) % 8}s`, animationDuration: `${7 + (i % 5)}s`, width: `${2 + i % 3}px`, height: `${2 + i % 3}px` }} />)}</div> }
