'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDownToLine,
  Braces,
  Check,
  Clipboard,
  Code2,
  FileCode2,
  GitBranch,
  Play,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'

const sampleLua = `local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local function greetPlayer(player)
    local message = "Welcome, " .. player.Name
    print(message)
    return message
end

Players.PlayerAdded:Connect(function(player)
    greetPlayer(player)
end)`

type Options = {
  rename: boolean
  strings: boolean
  comments: boolean
  compact: boolean
}

function obfuscateLua(source: string, options: Options) {
  if (!source.trim()) return ''
  let output = source
  if (options.comments) output = output.replace(/--[^\n]*/g, '')
  if (options.strings) {
    output = output.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (_, value: string) => {
      const encoded = [...value].map((char) => `\\${char.charCodeAt(0)}`).join('')
      return `string.char(${encoded.replaceAll('\\', ',').replace(/^,/, '')})`
    })
  }
  if (options.rename) {
    const names = ['Players', 'ReplicatedStorage', 'player', 'message', 'greetPlayer']
    names.forEach((name, index) => {
      output = output.replace(new RegExp(`\\b${name}\\b`, 'g'), `_${String.fromCharCode(97 + index)}${index + 1}`)
    })
  }
  if (options.compact) output = output.replace(/\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()
  return `-- Obfuscated with Luashield\n${output}`
}

export default function Page() {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const [options, setOptions] = useState<Options>({ rename: true, strings: true, comments: true, compact: false })
  const stats = useMemo(() => ({ input: source.length, output: result.length }), [source, result])

  const process = () => setResult(obfuscateLua(source, options))
  const copy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }
  const download = () => {
    if (!result) return
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'obfuscated.lua'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3"><div className="brand-mark"><Braces size={19} strokeWidth={2.5} /></div><div><p className="font-mono text-[15px] font-bold tracking-tight">luashield<span className="text-primary">.io</span></p><p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">roblox lua obfuscator</p></div></div>
          <nav className="hidden items-center gap-6 text-xs text-muted-foreground md:flex"><a href="#workspace" className="hover:text-foreground">Workspace</a><a href="#options" className="hover:text-foreground">Options</a><a href="#about" className="hover:text-foreground">About</a><a href="https://github.com" aria-label="GitHub" className="hover:text-foreground"><GitBranch size={16} /></a></nav>
          <div className="status-pill"><span className="status-dot" /> secure session</div>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-5 pb-8 pt-12 lg:px-8 lg:pt-16">
        <div className="max-w-3xl"><div className="eyebrow"><ShieldCheck size={14} /> client-side privacy</div><h1 className="mt-4 text-balance font-mono text-4xl font-bold tracking-[-0.06em] sm:text-6xl">Protect your code.<br /><span className="text-primary">Keep control.</span></h1><p className="mt-5 max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">A focused Lua obfuscator built for Roblox creators. Your scripts never leave this browser.</p></div>
      </section>

      <section id="workspace" className="mx-auto grid max-w-[1440px] gap-4 px-5 pb-8 lg:grid-cols-[1fr_1fr_280px] lg:px-8">
        <Editor title="source.lua" icon={<FileCode2 size={15} />} value={source} onChange={setSource} placeholder="-- paste your Roblox Lua script here..." />
        <Editor title="obfuscated.lua" icon={<Code2 size={15} />} value={result} readOnly placeholder="-- your protected script will appear here..." />
        <aside id="options" className="panel flex flex-col"><div className="panel-head"><span className="flex items-center gap-2"><Settings2 size={15} /> options</span><span className="text-[10px] text-muted-foreground">v1.0</span></div><div className="flex flex-col gap-1 p-3">{([['rename', 'Rename locals', 'replace identifiers'], ['strings', 'Encode strings', 'char sequence encoding'], ['comments', 'Strip comments', 'remove source notes'], ['compact', 'Compact output', 'single-line script']] as const).map(([key, label, note]) => <label key={key} className="option-row"><input type="checkbox" checked={options[key]} onChange={(e) => setOptions({ ...options, [key]: e.target.checked })} /><span className="checkmark">{options[key] && <Check size={12} />}</span><span><span className="block text-xs font-medium">{label}</span><span className="mt-0.5 block font-mono text-[9px] text-muted-foreground">{note}</span></span></label>)}</div><div className="mt-auto border-t border-border/70 p-4"><div className="mb-3 flex items-center justify-between font-mono text-[10px] text-muted-foreground"><span>INPUT</span><span>{stats.input.toLocaleString()} chars</span></div><div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground"><span>OUTPUT</span><span>{stats.output.toLocaleString()} chars</span></div></div></aside>
      </section>

      <section className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-5 pb-12 lg:px-8"><button className="primary-button" onClick={process}><Play size={15} fill="currentColor" /> Obfuscate script <span className="shortcut">⌘ ↵</span></button><button className="ghost-button" onClick={() => { setSource(sampleLua); setResult('') }}><Sparkles size={14} /> Load example</button><button className="ghost-button" onClick={() => { setSource(''); setResult('') }}><Trash2 size={14} /> Clear</button><div className="ml-auto flex gap-2"><button className="icon-button" onClick={copy} disabled={!result} aria-label="Copy output">{copied ? <Check size={16} /> : <Clipboard size={16} />}</button><button className="icon-button" onClick={download} disabled={!result} aria-label="Download output"><ArrowDownToLine size={16} /></button></div></section>

      <footer id="about" className="border-t border-border/70"><div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-6 text-[10px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><p className="font-mono">luashield.io / made for creators who ship</p><p className="flex items-center gap-2"><Zap size={12} className="text-primary" /> no uploads · no tracking · no nonsense</p></div></footer>
    </main>
  )
}

function Editor({ title, icon, value, onChange, readOnly, placeholder }: { title: string; icon: React.ReactNode; value: string; onChange?: (value: string) => void; readOnly?: boolean; placeholder: string }) {
  return <div className="panel min-h-[390px] overflow-hidden"><div className="panel-head"><span className="flex items-center gap-2">{icon} {title}</span><span className="flex gap-1"><i /><i /><i /></span></div><div className="editor-wrap"><div className="line-numbers" aria-hidden="true">{Array.from({ length: Math.max(14, value.split('\n').length) }, (_, i) => <span key={i}>{String(i + 1).padStart(2, '0')}</span>)}</div><textarea value={value} onChange={(e) => onChange?.(e.target.value)} readOnly={readOnly} spellCheck={false} placeholder={placeholder} aria-label={title} /></div></div>
}
