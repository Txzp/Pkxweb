'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Code2, Copy, FileCode2, KeyRound, Pencil, Plus, Trash2, Upload, X } from 'lucide-react'

type Script = { id: string; name: string; source?: string; visibility: 'private' | 'public'; created_at: string; loadstring: string }
type Theme = 'light' | 'dark' | 'hacker'
const sample = '-- xFuxk Tools\nlocal Players = game:GetService("Players")\nprint("Hello, " .. Players.LocalPlayer.Name)'

function Snow() {
  return <div className="snow" aria-hidden="true">{Array.from({ length: 36 }, (_, i) => <i key={i} style={{ left: `${(i * 29) % 100}%`, animationDelay: `${(i * 0.37) % 8}s`, animationDuration: `${7 + i % 5}s` }} />)}</div>
}

export default function Home() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [source, setSource] = useState('')
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [scripts, setScripts] = useState<Script[]>([])
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState('')
  const [editing, setEditing] = useState<Script | null>(null)
  const [editName, setEditName] = useState('')
  const [editSource, setEditSource] = useState('')
  const [editVisibility, setEditVisibility] = useState<'private' | 'public'>('private')
  const lines = useMemo(() => Math.max(1, source.split('\n').length), [source])
  const editLines = useMemo(() => Math.max(1, editSource.split('\n').length), [editSource])
  const notify = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(''), 2200) }
  const load = async () => { const response = await fetch('/api/lua', { cache: 'no-store' }); const data = await response.json(); setScripts(Array.isArray(data) ? data : []) }
  useEffect(() => { void load() }, [])
  const publish = async () => { if (!name.trim() || !source.trim()) return notify('Add a name and source.lua first'); const response = await fetch('/api/lua', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, source, visibility }) }); if (response.ok) { setName(''); setSource(''); notify('Script published'); void load() } else notify('Could not publish') }
  const copy = async (value: string, id: string) => { await navigator.clipboard.writeText(value); setCopied(id); window.setTimeout(() => setCopied(''), 1400) }
  const openEditor = async (script: Script) => { const response = await fetch(`/api/lua/${script.id}?edit=1`, { cache: 'no-store' }); if (!response.ok) { return notify('This script is not in your IP session') } const data = await response.json(); setEditing(script); setEditName(script.name); setEditSource(data.source || ''); setEditVisibility(script.visibility) }
  const saveEditor = async () => { if (!editing || !editName.trim() || !editSource.trim()) return notify('Name and source are required'); const response = await fetch(`/api/lua/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName, source: editSource, visibility: editVisibility }) }); if (response.ok) { setEditing(null); notify('Script updated'); void load() } else notify('Could not update script') }
  const remove = async (script: Script) => { if (!window.confirm(`Delete ${script.name}?`)) return; await fetch(`/api/lua/${script.id}`, { method: 'DELETE' }); void load() }

  return <main className={`app-shell theme-${theme}`}>
    <Snow />
    <header className="topbar"><div className="brand"><img src="/fx-logo.jpg" alt="xFuxk Tools" /><div><strong>xFuxk Tools</strong><span>Publish once. Load anywhere.</span></div></div><div className="theme-picker"><span>Theme</span>{(['light', 'dark', 'hacker'] as Theme[]).map(item => <button key={item} className={theme === item ? 'active' : ''} onClick={() => setTheme(item)}>{item}</button>)}</div></header>
    <nav className="tabs"><button className="active"><FileCode2 size={15} /> Obfuscator</button><button><KeyRound size={15} /> Key System</button></nav>
    <section className="workspace"><div className="section-heading"><div><p className="eyebrow">OBFUSCATOR</p><h1>Ship protected Lua.</h1><p>Publish a source once and get a clean loader for Roblox.</p></div><span className="session-badge">IP SESSION ACTIVE</span></div>
      <div className="editor-card"><div className="editor-toolbar"><input value={name} onChange={event => setName(event.target.value)} placeholder="script-name.lua" /><select value={visibility} onChange={event => setVisibility(event.target.value as 'private' | 'public')}><option value="private">Private</option><option value="public">Public</option></select><button className="ghost" onClick={() => setSource(sample)}><Upload size={14} /> Example</button></div><div className="code-wrap"><div className="line-numbers">{Array.from({ length: lines }, (_, index) => <span key={index}>{index + 1}</span>)}</div><textarea value={source} onChange={event => setSource(event.target.value)} placeholder="paste source.lua here..." spellCheck={false} /></div><div className="editor-footer"><span>{source.length.toLocaleString()} chars</span><button className="publish-button" onClick={publish}><Plus size={15} /> Publish script</button></div></div>
      <div className="feed-section"><div className="feed-heading"><h2>Your scripts</h2><span>{scripts.length} published</span></div><div className="feed">{scripts.length === 0 ? <div className="empty-state">No scripts published yet.</div> : scripts.map(script => <article className="feed-card" key={script.id}><div><strong>{script.name}</strong><p>{new Date(script.created_at).toLocaleString()} · {script.visibility}</p></div><div className="card-actions"><button aria-label={`Copy loadstring for ${script.name}`} title="Copy loadstring" onClick={() => copy(script.loadstring, script.id)}>{copied === script.id ? <Check size={15} /> : <Copy size={15} />}</button><button aria-label={`Edit source, name and visibility for ${script.name}`} title="Edit source, name and visibility" onClick={() => void openEditor(script)}><Code2 size={15} /></button><button aria-label={`Delete ${script.name}`} title="Delete" onClick={() => void remove(script)}><Trash2 size={15} /></button></div></article>)}</div></div>
    </section>
    {message && <div className="toast" role="status">{message}</div>}
    {editing && <div className="editor-overlay" role="dialog" aria-modal="true" aria-label={`Edit ${editing.name}`}><div className="editor-modal"><div className="editor-header"><div><strong>Edit script</strong><p>{editing.name} · {editLines} lines</p></div><button className="icon-button" aria-label="Close editor" onClick={() => setEditing(null)}><X size={16} /></button></div><div className="edit-fields"><input value={editName} onChange={event => setEditName(event.target.value)} aria-label="Script name" placeholder="script-name.lua" /><select value={editVisibility} onChange={event => setEditVisibility(event.target.value as 'private' | 'public')} aria-label="Script visibility"><option value="private">Private</option><option value="public">Public</option></select></div><div className="code-wrap edit-code"><div className="line-numbers">{Array.from({ length: editLines }, (_, index) => <span key={index}>{index + 1}</span>)}</div><textarea value={editSource} onChange={event => setEditSource(event.target.value)} aria-label="Lua source editor" spellCheck={false} /></div><div className="editor-footer"><span>{editSource.length.toLocaleString()} chars</span><button className="publish-button" onClick={() => void saveEditor()}>Save changes</button></div></div></div>}
  </main>
}
