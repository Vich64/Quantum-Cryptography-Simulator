import { Fragment } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Bubble } from './Characters.jsx'
import { Icon } from './Icons.jsx'
import { ErrorMeter, pct } from './Simulator.jsx'

const axis = { fontSize: 12, fill: '#5B5F86' }
const INK = '#16133A'
const GRID = '#E3E8F4'
const asPct = (v) => `${Math.round(v * 100)}%`
const LIMIT = 0.11

// Most Eve can read and still stay under the 11% line, given the channel noise p.
// errors = e(1 - p) + (1 - e)p with e = f/4  =>  f = 4(0.11 - p) / (1 - 2p)
export function cleverEvePercent(noisePercent = 0) {
  const p = noisePercent / 100
  const f = Math.max(0, Math.min(1, (4 * (LIMIT - p)) / (1 - 2 * p)))
  return Math.floor((f * 100) / 5) * 5 // the slider moves in steps of 5
}

/* ---------- The 4 steps ---------- */
export const SPY_STEPS = [
  { id: 1, short: 'Set up', title: 'How does Eve get caught?' },
  { id: 2, short: 'Verdict', title: 'Did Alice and Bob spot her?' },
  { id: 3, short: 'Spy map', title: 'Where was Eve?' },
  { id: 4, short: 'Catch clever Eve', title: 'Can a clever Eve hide?' },
]
const needsRun = (id) => id === 2 || id === 3

function StepDots({ step, setStep, run }) {
  return (
    <nav aria-label="Spy Lab steps">
      <ol className="stepdots">
        {SPY_STEPS.map((s) => {
          const here = s.id === step
          const locked = needsRun(s.id) && !run
          return (
            <li key={s.id}>
              <button type="button" className={`stepdot ${here ? 'here' : ''}`} aria-current={here ? 'step' : undefined}
                disabled={locked} title={locked ? 'Send photons first' : undefined} onClick={() => setStep(s.id)}>
                <span className="dot" aria-hidden>{s.id}</span>
                <span className="lbl">{s.short}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Back / Next buttons. Used in the guide card, and again under the board on phones. */
function StepNav({ step, setStep: go }) {
  const next = SPY_STEPS[step]
  return (
    <div className="flex flex-wrap items-center gap-3">
      {next
        ? <button className="pill" onClick={() => go(step + 1)}>Next: {next.short} <Icon name="right" size={18} strokeWidth={2.6} /></button>
        : <button className="pill" onClick={() => go(1)}>Try new <span className="hl">settings</span></button>}
      <button className="btn-ghost-dark" onClick={() => go(step - 1)}><Icon name="left" size={18} strokeWidth={2.6} /> Back</button>
    </div>
  )
}

function GrownUps({ children }) {
  return (
    <details className="grownups">
      <summary>For grown-ups</summary>
      <div className="space-y-2 mt-2">{children}</div>
    </details>
  )
}

/* ---------- Step 1: preview what the maths expects ---------- */
function Preview({ settings }) {
  const f = settings.eveOn ? settings.evePercent / 100 : 0
  const p = settings.noisePercent / 100
  const e = f / 4
  const expected = e * (1 - p) + (1 - e) * p
  const tile = (k, v) => (
    <div className="panel p-3 text-center">
      <div className="text-[12px] muted">{k}</div>
      <div className="text-[20px] font-extrabold text-[var(--ink-strong)] tabular-nums">{v}</div>
    </div>
  )
  return (
    <div className="screen-pad space-y-4">
      <div>
        <h3>What should happen?</h3>
        <p className="muted m-0">This is what the maths expects. Press <b>Send photons</b> to see what really happens.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {tile('Eve peeks at', f > 0 ? `${settings.evePercent}%` : 'off')}
        {tile('Noise', `${settings.noisePercent}%`)}
        {tile('Photons', settings.nPhotons)}
      </div>
      <ErrorMeter value={expected} label="Mistakes we expect" />
      <div className={`note ${expected > LIMIT ? 'good' : f > 0 ? 'warn' : ''}`}>
        {expected > LIMIT
          ? <>About <b>{pct(expected)}</b> mistakes: over the spy line. Alice and Bob should spot her.</>
          : f > 0
            ? <>About <b>{pct(expected)}</b> mistakes: under the spy line. Eve might stay hidden!</>
            : <>No spy. {p > 0 ? <>Any mistakes will only be <b>noise</b>.</> : 'Bob should read every kept number right.'}</>}
      </div>
      <p className="text-[13px] muted m-0">Real runs wobble around this guess, more so with only a few photons.</p>
    </div>
  )
}

/* ---------- Step 2: the verdict ---------- */
function VerdictHead({ run }) {
  if (run.status === 'too_short') {
    return <div className="verdict idle"><span className="ico text-[24px] font-extrabold" aria-hidden>?</span><div><b>Too few numbers to check</b><span>Send more photons so Alice and Bob have something to compare.</span></div></div>
  }
  const bad = run.status === 'rejected'
  return (
    <div className={`verdict ${bad ? 'bad' : 'good'}`}>
      <span className="ico" aria-hidden><Icon name={bad ? 'x' : 'check'} size={26} strokeWidth={3} /></span>
      <div>
        <b>{bad ? 'Throw the key away' : 'Carry on'}</b>
        <span>
          {pct(run.estimated_qber)} of the checked numbers were wrong. That's {bad ? 'over' : 'under'} the 11% spy line.
        </span>
      </div>
    </div>
  )
}

function MistakeBars({ run }) {
  const bars = [
    { name: 'Numbers said out loud', v: run.estimated_qber ?? 0 },
    { name: 'All kept numbers', v: run.actual_qber ?? 0 },
  ]
  return (
    <div>
      <h3>How many mistakes?</h3>
      <p className="text-[14px] muted m-0">
        Alice and Bob only see the <b>first bar</b>. The second bar is the whole truth, and only the simulator knows it.
      </p>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={bars} layout="vertical" margin={{ top: 16, right: 24, bottom: 0, left: 4 }}>
          <XAxis type="number" domain={[0, 0.5]} tickFormatter={asPct} tick={axis} ticks={[0, 0.11, 0.25, 0.5]} />
          <YAxis type="category" dataKey="name" width={130} tick={axis} />
          <Tooltip formatter={(v) => pct(v, 1)} />
          <ReferenceLine x={LIMIT} stroke={INK} strokeWidth={2} strokeDasharray="4 3" label={{ value: 'spy line 11%', position: 'top', fontSize: 12, fill: INK }} />
          <Bar dataKey="v" name="Mistakes" radius={[0, 4, 4, 0]} barSize={22} label={{ position: 'right', formatter: (v) => pct(v), fontSize: 13, fontWeight: 700, fill: INK }} stroke={INK} strokeWidth={2}>
            {bars.map((b, i) => <Cell key={i} fill={b.v > LIMIT ? '#E0344B' : '#0E9F6E'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function EveCopy({ run }) {
  const keyLen = run.alice_key.length
  if (run.eve_count === 0) {
    return (
      <div className="note good">
        This time nobody was listening{run.noise_fraction > 0 ? ', so every mistake was noise' : ''}. But only the simulator knows that!
      </div>
    )
  }
  const keyPhotons = run.photons.filter((p) => p.in_key)
  const known = keyPhotons.map((p) => p.eve_read && p.eve_bit === p.alice_bit)
  return (
    <div className={`note ${run.status === 'accepted' ? 'warn' : ''} space-y-2`}>
      {run.status === 'accepted'
        ? <div><Icon name="alert" size={18} /> "Carry on" does <b>not</b> mean "no spy"! Eve peeked at {run.eve_count} photons.</div>
        : <div>Good thing they threw it away: Eve peeked at {run.eve_count} photons.</div>}
      {keyLen > 0 && (
        <>
          <div className="bits text-[15px] break-all leading-relaxed" aria-label={`Secret key with ${run.eve_known_key_bits} numbers Eve copied`}>
            {run.alice_key.map((b, i) => (
              <Fragment key={i}><span className={known[i] ? 'bit-eve' : ''}>{b}</span>{i % 8 === 7 ? ' ' : ''}</Fragment>
            ))}
          </div>
          <div>
            Eve's copy matches <b>{run.eve_known_key_bits} of the {keyLen}</b> secret key numbers (the <span className="bit-eve">purple</span> ones).
            She is <i>sure</i> about {run.eve_sure_key_bits} of them, because she wore the right glasses.
          </div>
        </>
      )}
    </div>
  )
}

function Estimate({ run }) {
  return (
    <div>
      <h3>How much did Eve read?</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="panel p-3">
          <div className="text-[12px] muted">Alice & Bob's guess</div>
          <div className="text-[28px] font-extrabold text-[var(--eve)] tabular-nums leading-tight">{pct(run.estimated_eve_fraction)}</div>
          <div className="text-[12px] muted">mistakes × 4</div>
        </div>
        <div className="panel p-3">
          <div className="text-[12px] muted">The truth (only the simulator knows)</div>
          <div className="text-[28px] font-extrabold text-[var(--ink-strong)] tabular-nums leading-tight">{pct(run.eve_fraction)}</div>
          <div className="text-[12px] muted">{run.eve_count} of {run.n_photons} photons</div>
        </div>
      </div>
      <p className="text-[14px] muted mt-2 mb-0">
        Every photon Eve reads makes a mistake 1 time in 4, so Alice and Bob multiply the mistakes by 4.
        {run.noise_fraction > 0 && <> Noise mistakes look just like Eve's, so with noise their guess comes out too high.</>}
      </p>
    </div>
  )
}

function VerdictStep({ run }) {
  return (
    <div className="screen-pad space-y-4">
      <VerdictHead run={run} />
      {run.check_count > 0 && <MistakeBars run={run} />}
      <EveCopy run={run} />
      {run.check_count > 0 && <Estimate run={run} />}
      <GrownUps>
        {run.check_count > 0 && (
          <p className="m-0">
            <b>The estimate:</b> {pct(run.estimated_qber, 1)} errors × 4 = {pct(run.estimated_eve_fraction)}.
            {run.estimated_eve_range && <> Because they only checked {run.check_count} numbers, the real share is probably
              between {pct(run.estimated_eve_range[0])} and {pct(run.estimated_eve_range[1])} (95% Wilson interval × 4).</>}
          </p>
        )}
        <p className="m-0">
          <b>Privacy amplification:</b> real QKD always assumes Eve knows part of the key. After error correction, Alice and Bob
          hash the key into a shorter one, sized from the measured error rate, so Eve's partial knowledge of the long key tells her
          almost nothing about the short one. This simulator stops before that step.
        </p>
      </GrownUps>
    </div>
  )
}

/* ---------- Step 3: spy map, one cell per kept photon ---------- */
const KINDS = {
  caught: { label: 'Eve touched it: mistake caught in a checked number', bg: '#E0344B', fg: '#fff', border: '#E0344B' },
  theory: { label: 'Eve touched it: mistake hiding in the key', bg: '#FDE4E7', fg: '#7A1022', border: '#E0344B' },
  hidden: { label: 'Eve touched it: no mistake (right glasses, or Bob got lucky)', bg: '#F3EAFD', fg: '#4B1785', border: '#8B3DDB' },
  noise: { label: 'Eve never touched it, but noise made a mistake', bg: '#FFF0D1', fg: '#5E3700', border: '#E08A00' },
  clean: { label: 'Eve never touched it', bg: '#F3F5FB', fg: '#5B5F86', border: '#D3DAEC' },
}
function kindOf(p) {
  if (p.eve_read) return p.error ? (p.is_check ? 'caught' : 'theory') : 'hidden'
  return p.error ? 'noise' : 'clean'
}
const list = (ps) => (ps.length ? ps.map((p) => `#${p.index}`).join(', ') : 'none')

function SpyMap({ run, selected, onSelect }) {
  const kept = run.photons.filter((p) => p.same_filter)
  const counts = Object.fromEntries(Object.keys(KINDS).map((k) => [k, 0]))
  kept.forEach((p) => { counts[kindOf(p)] += 1 })
  const touched = kept.filter((p) => p.eve_read)
  const showing = touched.filter((p) => p.eve_caught)
  const caughtChecked = showing.filter((p) => p.is_check)
  const caughtKey = showing.filter((p) => p.in_key)
  const tossed = run.photons.filter((p) => p.eve_read && !p.same_filter).length
  const kinds = Object.keys(KINDS).filter((k) => k !== 'noise' || counts.noise > 0 || run.noise_fraction > 0)

  return (
    <div className="screen-pad space-y-3">
      <div>
        <h3>Spy map</h3>
        <p className="text-[14px] muted m-0">
          One square for every kept photon. A <b>dashed</b> border means Alice and Bob said that number out loud.
          Tap a square to follow that photon.
        </p>
      </div>
      <div className="flex flex-wrap gap-[4px]" role="group" aria-label={`Spy map of ${kept.length} kept photons`}>
        {kept.map((p) => {
          const k = KINDS[kindOf(p)]
          const i = run.photons.indexOf(p)
          const label = `Photon ${p.index}: ${k.label}${p.is_check ? ', said out loud' : ', in the key'}`
          return (
            <button key={p.index} type="button" title={label} aria-label={label} aria-pressed={selected === i} onClick={() => onSelect(i)}
              className="spycell" style={{ background: k.bg, color: k.fg, border: `2px ${p.is_check ? 'dashed' : 'solid'} ${p.is_check ? INK : k.border}` }}>
              {p.index}
            </button>
          )
        })}
      </div>
      <ul className="list-none p-0 m-0 grid sm:grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
        {kinds.map((k) => (
          <li key={k} className="flex items-start gap-2">
            <span className="inline-block w-3.5 h-3.5 mt-[3px] rounded-[3px] shrink-0" style={{ background: KINDS[k].bg, border: `2px solid ${KINDS[k].border}` }} />
            <span><b className="tabular-nums">{counts[k]}</b> {KINDS[k].label}</span>
          </li>
        ))}
      </ul>
      {touched.length > 0 ? (
        <div className="note space-y-1">
          <div>
            Eve touched <b>{touched.length}</b> kept photons, but only <b>{showing.length}</b> turned into mistakes
            (<b>about {Math.round((showing.length / touched.length) * 100)}%</b>; the maths says about 1 in 4).
            {tossed > 0 && <> She also touched {tossed} photons that were thrown away (different glasses).</>}
          </div>
          <div><Icon name="search" size={18} /> Caught where Alice and Bob looked: <b>{list(caughtChecked)}</b></div>
          <div><Icon name="eyeoff" size={18} /> Mistakes hiding in the key (nobody checked them): <b>{list(caughtKey)}</b></div>
        </div>
      ) : (
        <div className="note">Eve didn't touch any kept photon this time.{counts.noise > 0 && <> Every mistake here is <b>noise</b>.</>}</div>
      )}
    </div>
  )
}

/* ---------- Step 4: detection chance and the 0 → 100% sweep ---------- */
// One purple, light to dark = Eve peeks a little to a lot. All three pass 3:1 on white.
const DETECT_LINES = [
  { f: 0.1, name: 'Eve peeks 10%', color: '#A878EE' },
  { f: 0.4, name: 'Clever Eve 40%', color: '#6A1FC2' },
  { f: 1, name: 'Eve peeks 100%', color: '#2E0A5C' },
]
const detect = (f, n) => 1 - (1 - 0.25 * f) ** n

function DetectionChart({ run }) {
  const maxN = Math.max(100, Math.ceil(((run?.check_count || 0) * 1.3) / 10) * 10)
  const data = []
  for (let n = 0; n <= maxN; n += 2) {
    const row = { n }
    DETECT_LINES.forEach((l, i) => { row[`p${i}`] = detect(l.f, n) })
    data.push(row)
  }
  const thisRun = run && run.eve_fraction > 0 && run.check_count ? detect(run.eve_fraction, run.check_count) : null
  return (
    <div>
      <h3>Check more numbers, spot Eve more often</h3>
      <p className="text-[14px] muted m-0">
        Every number Alice and Bob check is one more chance to catch a mistake Eve made.
        Clever Eve at 40% only makes about 10 mistakes in 100, but if they check 50 numbers they spot one of them <b>{pct(detect(0.4, 50))}</b> of the time.
      </p>
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="n" tick={axis} type="number" domain={[0, maxN]} label={{ value: 'numbers checked', position: 'insideBottomRight', offset: -2, fontSize: 12, fill: '#5B5F86' }} />
          <YAxis domain={[0, 1]} tickFormatter={asPct} tick={axis} ticks={[0, 0.5, 1]} />
          <Tooltip formatter={(v) => pct(v, 0)} labelFormatter={(l) => `${l} numbers checked`} />
          <Legend wrapperStyle={{ fontSize: 12 }} itemSorter="dataKey" />
          {run?.check_count > 0 && (
            <ReferenceLine x={run.check_count} stroke="#B86E00" strokeWidth={2} strokeDasharray="4 3" label={{ value: `you checked ${run.check_count}`, position: 'top', fontSize: 12, fill: '#8A5200' }} />
          )}
          {DETECT_LINES.map((l, i) => (
            <Line key={i} type="monotone" dataKey={`p${i}`} name={l.name} stroke={l.color} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {thisRun != null && (
        <p className="text-[14px] mt-2 mb-0">
          Your last run: Eve at {pct(run.eve_fraction)} and {run.check_count} numbers checked gives a <b>{pct(thisRun)}</b> chance to spot at least one of her mistakes.
        </p>
      )}
    </div>
  )
}

function Sweep({ sweep, sweepBusy, onSweep }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h3>The more Eve peeks, the more mistakes</h3>
        <button className="btn-cyan" disabled={sweepBusy} onClick={onSweep}>{sweepBusy ? 'Running…' : sweep ? 'Run again' : 'Try 0% → 100%'}</button>
      </div>
      {sweep ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={sweep.points} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="eve_percent" tickFormatter={(v) => `${v}%`} tick={axis} />
            <YAxis domain={[0, 0.35]} tickFormatter={asPct} tick={axis} ticks={[0, 0.11, 0.25]} />
            <Tooltip formatter={(v) => pct(v, 1)} labelFormatter={(l) => `Eve peeks at ${l}%`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={LIMIT} stroke={INK} strokeWidth={2} strokeDasharray="4 3" label={{ value: 'spy line', position: 'insideTopLeft', fontSize: 12, fill: INK }} />
            <Line type="linear" dataKey="theory" name={sweep.noise_fraction > 0 ? `What the maths predicts (with ${pct(sweep.noise_fraction)} noise)` : 'What the maths predicts'} stroke="#5B5F86" strokeDasharray="5 4" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="measured" name={`Qiskit simulation (${sweep.n_photons} photons each)`} stroke="#6A1FC2" strokeWidth={2} dot={{ r: 4, stroke: '#fff', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-[14px] muted m-0">Plays the game 11 times, with Eve peeking at 0%, 10%, … up to 100% of photons, and draws the mistakes. It uses your noise setting too.</p>
      )}
    </div>
  )
}

function CleverStep({ run, sweep, sweepBusy, onSweep }) {
  return (
    <div className="screen-pad space-y-4">
      <DetectionChart run={run} />
      <hr className="etched" />
      <Sweep sweep={sweep} sweepBusy={sweepBusy} onSweep={onSweep} />
      <GrownUps>
        <p className="m-0">
          <b>Detection chance:</b> P = 1 − (1 − ¼·f)ⁿ, where f is Eve's share of photons and n is how many numbers are checked.
          Each checked number Eve touched has a ¼ chance to show an error, and the checks are independent.
        </p>
        <p className="m-0">
          <b>Clever Eve:</b> the expected error rate is e(1 − p) + (1 − e)p with e = f/4 and noise p. Setting it to 11% gives the
          largest f that stays under the line: f = 4(0.11 − p)/(1 − 2p).
        </p>
        <p className="m-0">
          Spotting one mistake is not the same as throwing the key away: below 11% Alice and Bob still carry on, and real systems
          then shrink the key with privacy amplification.
        </p>
      </GrownUps>
    </div>
  )
}

/* ---------- The board (right side) ---------- */
export function EveScreen({ step, setStep, settings, run, sweep, sweepBusy, onSweep, selected, onSelect }) {
  let body
  if (step === 1) body = <Preview settings={settings} />
  else if (needsRun(step) && !run) {
    body = (
      <div className="screen-pad">
        <p className="muted">No photons yet. Go back to <b>Set up</b> and press <b>Send photons</b> first.</p>
        <button className="btn-ghost-dark" onClick={() => setStep(1)}><Icon name="left" size={18} strokeWidth={2.6} /> Back to Set up</button>
      </div>
    )
  } else if (step === 2) body = <VerdictStep run={run} />
  else if (step === 3) body = <SpyMap run={run} selected={selected} onSelect={onSelect} />
  else body = <CleverStep run={run} sweep={sweep} sweepBusy={sweepBusy} onSweep={onSweep} />
  // On phones the board sits under the guide card, so after Next/Back here jump to the top of the new step.
  const goFromBoard = (n) => {
    setStep(n)
    requestAnimationFrame(() => document.getElementById('spy-board')?.closest('.board')?.scrollIntoView({ block: 'start' }))
  }
  return (
    <div key={step} id="spy-board" className="fadein">
      {body}
      {step > 1 && <div className="only-narrow screen-pad pt-0"><StepNav step={step} setStep={goFromBoard} /></div>}
    </div>
  )
}

/* ---------- The guide card (left side) ---------- */
export function EveLeft({ step, setStep, settings, setSettings, busy, error, onRun, onOpenTable, run }) {
  const clever = cleverEvePercent(settings.noisePercent)
  const s = SPY_STEPS[step - 1]
  const send = async () => { if (await onRun({ jumpTo: 5 })) setStep(2) }
  return (
    <>
      <div>
        <div className="text-[13px] text-[var(--ink-soft)]" aria-live="polite">Spy Lab · Step {step} of 4: {s.short}</div>
        <h2>{s.title}</h2>
      </div>
      <StepDots step={step} setStep={setStep} run={run} />

      {step === 1 && (
        <>
          <Bubble who="eve">To steal a number I must look at the photon before Bob. I don't know Alice's glasses, so I <b>guess</b>. When I guess wrong, I <b>bend the stick</b>!</Bubble>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={settings.eveOn} onChange={(e) => setSettings({ ...settings, eveOn: e.target.checked })} className="accent-[var(--eve)] w-4 h-4" />
            Let Eve the spy listen
          </label>
          <label className={settings.eveOn ? '' : 'opacity-50'}>
            Eve peeks at <b className="text-[var(--ink-strong)]">{settings.evePercent}%</b> of photons
            <input type="range" min={0} max={100} step={5} disabled={!settings.eveOn} value={settings.evePercent}
              onChange={(e) => setSettings({ ...settings, evePercent: Number(e.target.value) })} className="w-full accent-[var(--eve)]" />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-ghost-dark" onClick={() => setSettings({ ...settings, eveOn: true, evePercent: clever })}
              title="The most Eve can read while staying under the 11% line"><Icon name="shades" size={18} /> Clever Eve ({clever}%)</button>
            <span className="text-[13px] muted">
              {clever > 0 ? 'She peeks just enough to hide under the spy line.' : 'Too much noise: even honest runs fail now.'}
            </span>
          </div>
          <label>
            Noise on the line: <b className="text-[var(--ink-strong)]">{settings.noisePercent}%</b>
            <input type="range" min={0} max={20} step={1} value={settings.noisePercent}
              onChange={(e) => setSettings({ ...settings, noisePercent: Number(e.target.value) })} className="w-full accent-[var(--check)]" />
            <span className="block text-[13px] muted font-normal">Real cables wobble a bit. Alice and Bob can't tell noise from Eve.</span>
          </label>
          <label>
            Photons Alice sends: <b className="text-[var(--ink-strong)]">{settings.nPhotons}</b>
            <input type="range" min={8} max={256} step={8} value={settings.nPhotons}
              onChange={(e) => setSettings({ ...settings, nPhotons: Number(e.target.value) })} className="w-full accent-[var(--ink-strong)]" />
            <span className="block text-[13px] muted font-normal">With only a few photons Eve can get lucky. Try 128 or more.</span>
          </label>
          {error && <div className="note bad" role="alert">{error}</div>}
          <div className="flex flex-wrap items-center gap-3">
            <button className="pill" disabled={busy} onClick={send}>{busy ? 'Sending…' : <>Send <span className="hl">photons</span></>}</button>
            {run && <button className="btn-ghost-dark" onClick={() => setStep(2)}>See last result <Icon name="right" size={18} strokeWidth={2.6} /></button>}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Bubble who="bob">We read some kept numbers out loud and compare them. More than <b>11 in 100</b> wrong? A spy (or a noisy line) was there, so we throw the key away.</Bubble>
          <div className="note info">
            Eve guesses the wrong glasses <b>half</b> the time. Then Bob reads wrong <b>half</b> of those times.
            Half of a half = <b>a quarter</b>: about <b>25 mistakes in every 100</b> photons she peeks at.
          </div>
        </>
      )}

      {step === 3 && (
        <Bubble who="eve">Only the simulator can draw this map. <b>Red</b> squares are where I got caught. <b>Pink</b> ones are mistakes nobody checked. <b>Purple</b> ones I read without leaving a trace!</Bubble>
      )}

      {step === 4 && (
        <Bubble who="alice">A <b>clever</b> Eve peeks at only a few photons, so she stays under the spy line. Our trick: <b>check more numbers</b>. Every check is another chance to catch her.</Bubble>
      )}

      {step > 1 && (
        <>
          <StepNav step={step} setStep={setStep} />
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <button className="linkbtn" disabled={busy} onClick={() => onRun({ jumpTo: 5 })}>{busy ? 'Sending…' : <><Icon name="refresh" size={17} /> Send again, same settings</>}</button>
            {run && <button className="linkbtn" onClick={onOpenTable}>See the photon table</button>}
          </div>
          {error && <div className="note bad" role="alert">{error}</div>}
        </>
      )}
    </>
  )
}
