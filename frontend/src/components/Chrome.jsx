import { useEffect, useState } from 'react'
import { getCircuit } from '../api.js'
import { Icon } from './Icons.jsx'
import { GlowPhoton, Photon, sym } from './Photon.jsx'
import { STATUS, pct } from './Simulator.jsx'

export const AREA = { home: 'home', story: 'learn', missions: 'learn', quiz: 'learn', simulator: 'lab', eve: 'lab' }
const AREAS = [
  { id: 'home', t: 'Home', ico: 'home' },
  { id: 'learn', t: 'Learn', ico: 'book' },
  { id: 'lab', t: 'Lab', ico: 'flask' },
]

/** One compact row: Home / Learn / Lab, plus the stars. The path or lab tabs sit under it, not inside it. */
export function TopBar({ area, onArea, totalStars }) {
  return (
    <header className="topbar">
      <div className="wrap flex items-center gap-2 sm:gap-4 py-2">
        <button type="button" className="brand hidden sm:flex" onClick={() => onArea('home')} aria-label="Quantum Cryptography Simulator, go to Home">
          <GlowPhoton size={38} />
          <span className="logo hidden md:block">Quantum Cryptography Simulator<small>Learn the BB84 secret-key game</small></span>
        </button>
        <nav className="tabs" aria-label="Main">
          {AREAS.map((x) => (
            <button key={x.id} className={`tab ${area === x.id ? 'active' : ''}`} aria-current={area === x.id ? 'page' : undefined} onClick={() => onArea(x.id)}>
              <Icon name={x.ico} size={18} className="ico" />{x.t}
            </button>
          ))}
        </nav>
        <span className="chip bg-[var(--photon-soft)] text-[var(--ink-strong)] ml-auto shrink-0 tabular-nums" title="Stars earned in Missions and the Boss Quiz">
          <span className="stars"><Icon name="star" fill size={16} className="on" /></span> {totalStars} / 15<span className="sr-only"> stars</span>
        </span>
      </div>
    </header>
  )
}

/** Page layout: a guide card (characters + buttons) next to the play board. */
export function Stage({ left, screen, tablet }) {
  return (
    <section className="stage">
      <div className="card stage-left">
        {left}
        {tablet && <div className="status">{tablet}</div>}
      </div>
      <div className="card board">{screen}</div>
    </section>
  )
}

export function StatusTablet({ run, revealed, health }) {
  if (!run) return <div className="text-[13px] muted">No photons sent yet. {health ? '' : <span className="text-[var(--bad)]">The simulator backend is offline.</span>}</div>
  const cell = (k, v) => <div className="bg-[var(--tint)] rounded-lg px-2 py-1.5 text-center"><div className="text-[11px] muted">{k}</div><div className="font-extrabold text-[var(--ink-strong)]">{v}</div></div>
  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5">
        {cell('Photons', run.n_photons)}
        {cell('Kept', revealed.kept ? pct(run.keep_rate) : '…')}
        {cell('Mistakes', revealed.errors ? pct(run.estimated_qber, 0) : '…')}
        {cell('Key size', revealed.errors ? run.alice_key.length : '…')}
      </div>
      {revealed.errors && <div className="mt-2 text-center"><span className={`badge ${STATUS[run.status].cls}`}>{STATUS[run.status].label}</span></div>}
    </div>
  )
}

/** Shows one photon's journey in plain words, plus the Qiskit circuit that simulated it. */
export function Inspector({ run, index, step, onClose, hint }) {
  const p = run?.photons[index]
  const [circ, setCirc] = useState({ key: null, text: '', error: null })
  const key = p ? `${p.alice_bit}${p.alice_filter}${p.bob_filter}${p.eve_filter ?? ''}` : null
  useEffect(() => {
    if (!p || circ.key === key) return
    let live = true
    const params = { alice_bit: p.alice_bit, alice_filter: p.alice_filter, bob_filter: p.bob_filter }
    if (p.eve_read) params.eve_filter = p.eve_filter
    getCircuit(params)
      .then((r) => live && setCirc({ key, text: r.circuit, error: null }))
      .catch((e) => live && setCirc({ key, text: '', error: e.message }))
    return () => { live = false }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!p) return null
  const show = step >= 2
  return (
    <section className="card p-5 grid md:grid-cols-[1fr_1.2fr] gap-5" aria-label="Follow one photon">
      <div className="text-[15px]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="m-0 text-[18px] font-extrabold text-[var(--ink-strong)]">Follow photon {p.index}</h3>
          {onClose && <button className="btn-ghost-dark" onClick={onClose} aria-label={`Close photon ${p.index}`}><Icon name="x" size={16} /> Close</button>}
        </div>
        <ol className="pl-5 m-0 space-y-1.5">
          <li>Alice sends the number <b>{p.alice_bit}</b> using <b>{sym(p.alice_filter)} glasses</b>, so the stick looks like <Photon filter={p.alice_filter} bit={p.alice_bit} />.</li>
          {p.eve_read && show && (
            <li>Eve peeks with <b>{sym(p.eve_filter)} glasses</b>.{' '}
              {p.eve_changed
                ? <span className="text-[var(--bad)]">Wrong guess! She bends the stick into <Photon filter={p.eve_filter} bit={p.eve_bit} color="#E0344B" />.</span>
                : <>Lucky guess: the stick stays <Photon filter={p.eve_filter} bit={p.eve_bit} />.</>}</li>
          )}
          {show && (
            <li>Bob looks with <b>{sym(p.bob_filter)} glasses</b> and reads <b className={p.error && step >= 4 ? 'text-[var(--bad)]' : ''}>{p.bob_bit}</b>.{' '}
              {p.same_filter ? 'Same glasses as Alice, so he can be sure.' : 'Different glasses from Alice, so it was only a coin-flip guess.'}
              {p.noise_flip && <span className="text-[var(--check)]"> Noise on the line flipped his number!</span>}</li>
          )}
          {step >= 3 && (
            <li>{p.same_filter ? <b className="text-[var(--good)]">Keep it!</b> : <b className="text-[var(--ink-soft)]">Throw it away.</b>}
              {p.is_check && step >= 4 ? ' They say this number out loud to check for a spy.' : ''}
              {p.in_key && step >= 5 ? ' It becomes part of the secret key.' : ''}
              {p.error && step >= 4 ? <span className="text-[var(--bad)]"> Bob's number is wrong: a sign of a spy!</span> : ''}</li>
          )}
        </ol>
        {hint && <p className="muted text-[13px] mt-3 mb-0">{hint}</p>}
      </div>
      <div>
        <div className="text-[13px] muted mb-1"><b>For grown-ups:</b> the Qiskit circuit that simulated this photon. X writes a 1, H switches to × glasses, M measures (c0 = Bob, c1 = Eve).</div>
        <pre className="bits bg-[var(--ink-strong)] text-[#FFE7A3] rounded-lg p-3 overflow-x-auto m-0 text-[12px] leading-tight min-h-[90px]">
          {circ.error ? `Could not load circuit: ${circ.error}` : circ.text || 'Loading…'}
        </pre>
      </div>
    </section>
  )
}

export function Footer({ health, healthError }) {
  return (
    <footer className="wrap py-8 text-center text-[13px] muted">
      Team 6 · Group 2 Software Engineer · CADT Quantum Computing ·{' '}
      {health
        ? <span className="text-[var(--good)]">Simulator online (Qiskit {health.qiskit})</span>
        : <span className="text-[var(--bad)]">{healthError || 'Checking simulator…'}</span>}
    </footer>
  )
}
