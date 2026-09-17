'use client'

import { useEffect, useState } from 'react'
import { Copy, Search } from 'lucide-react'

type PublishedScript = { id: string; title: string; thumbnail: string; loadstring: string; tag: string | null; created_at: string }

export default function PublicHome() {
  const [scripts, setScripts] = useState<PublishedScript[]>([])
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState('')
  useEffect(() => { fetch('/api/catalog').then((response) => response.json()).then((data) => setScripts(data.scripts || [])) }, [])
  const filtered = scripts.filter((script) => `${script.title} ${script.tag || ''}`.toLowerCase().includes(query.toLowerCase()))
  async function copyLoadstring(script: PublishedScript) { await navigator.clipboard.writeText(script.loadstring); setCopied(script.id); window.setTimeout(() => setCopied(''), 1400) }
  return <main className="catalog-page"><div className="thunder-layer" aria-hidden="true"/><header className="catalog-header"><div className="catalog-brand"><span className="brand-mark">P</span><div><strong>Peak X</strong><small>ROBLOX SCRIPT LIBRARY</small></div></div><div className="catalog-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search scripts" aria-label="Search scripts"/></div><a href="/adminpanel" className="admin-link">Admin panel</a></header><section className="catalog-hero"><p className="eyebrow">PUBLIC CATALOG</p><h1>Discover your next load.</h1><p>Curated Roblox scripts, published from Peak X.</p></section><section className="game-grid" aria-label="Published scripts">{filtered.map((script) => <article className="game-card" key={script.id}><div className="img-wrap"><img src={script.thumbnail} alt={script.title} loading="lazy"/></div><div className="game-meta"><span className="name">{script.title}</span><span className="tag">{script.tag || 'FREE'}</span></div><button className="copy-loadstring" onClick={() => copyLoadstring(script)}><Copy size={14}/>{copied === script.id ? 'Copied' : 'Copy loadstring'}</button></article>)}{filtered.length === 0 && <div className="empty-catalog">No published scripts yet.</div>}</section></main>
}

/* global styles in app/globals.css */

