'use client'

import { useEffect, useState } from 'react'
import { Copy, Home as HomeIcon, Library } from 'lucide-react'

type Script = { id: string; title: string; thumbnail: string; loadstring: string; tag: string | null }

function Snow() { return <div className="snow" aria-hidden="true">{Array.from({ length: 70 }, (_, index) => <i key={index} style={{ left: `${(index * 37) % 100}%`, animationDelay: `${(index * 0.21) % 8}s`, animationDuration: `${7 + (index % 8)}s`, width: `${2 + index % 4}px`, height: `${2 + index % 4}px` }} />)}</div> }

export default function Home() {
  const [tab, setTab] = useState<'home' | 'scripts'>('home'); const [scripts, setScripts] = useState<Script[]>([]); const [copied, setCopied] = useState('')
  useEffect(() => { fetch('/api/catalog').then((r) => r.json()).then((d) => setScripts(d.scripts || [])) }, [])
  async function copy(script: Script) { await navigator.clipboard.writeText(script.loadstring); setCopied(script.id); window.setTimeout(() => setCopied(''), 1400) }
  return <main className="public-site"><Snow/><header className="public-nav"><a className="public-brand" href="/" onClick={() => setTab('home')}><img src="/peak-x-logo.jpg" alt="Peak X"/><span>Peak X</span></a><nav><button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}><HomeIcon size={15}/>Home</button><button className={tab === 'scripts' ? 'active' : ''} onClick={() => setTab('scripts')}><Library size={15}/>Scripts</button></nav></header>{tab === 'home' ? <section className="public-home"><img className="hero-logo" src="/peak-x-logo.jpg" alt="Peak X logo"/><h1>Peak X</h1><p className="made-by">Made by <strong>.xl.r</strong></p><p className="bio">I live in Virginia Beach, VA, with my three wives. I&apos;m a fucking scripter and developer. Contact me</p></section> : <section className="public-scripts"><p className="eyebrow">PEAK X LIBRARY</p><h1>Games Scripts</h1><div className="public-grid">{scripts.map((script) => <article className="game-card" key={script.id}><div className="img-wrap"><img src={script.thumbnail} alt={script.title}/></div><div className="game-meta"><span className="name">{script.title}</span><span className="tag">{script.tag || 'FREE'}</span></div><button className="copy-loadstring" onClick={() => void copy(script)}><Copy size={14}/>{copied === script.id ? 'Copied' : 'Copy'}</button></article>)}{!scripts.length && <div className="empty-catalog">No scripts published yet.</div>}</div></section>}</main>
}
