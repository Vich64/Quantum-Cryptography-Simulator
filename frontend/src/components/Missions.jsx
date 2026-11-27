import { Icon } from './Icons.jsx'
import { useState } from 'react'
import { measureOnce, runBB84 } from '../api.js'
import { byteHex, lockMessage, toBytes } from '../otp.js'
import { Avatar, Bubble, Celebrate, Glasses, GlassTag, Mystery, Stars } from './Characters.jsx'
import { Stage } from './Chrome.jsx'
import { Photon } from './Photon.jsx'

export const MISSIONS = [
  { id: 'm1', title: 'Read the light sticks', desc: 'Learn the magic glasses and see what happens with the wrong ones.' },
  { id: 'm2', title: 'Be Bob: make a key', desc: 'Pick glasses for 8 photons, find the matches, and get a secret key.' },
  { id: 'm3', title: 'Spy hunt', desc: 'Look at the mistakes and decide: was Eve the spy listening?' },
  { id: 'm4', title: 'Secret message', desc: 'Lock a word with your key so only Bob can read it.' },
]

const coin = () => (Math.random() < 0.5 ? 0 : 1)
const randFilter = () => (Math.random() < 0.5 ? '+' : 'x')
const starsFor = (mistakes) => (mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1)

/* ---------------- shared bits ---------------- */

// Picking a mission happens in the Learn path above the stage.
function MissionHead({ index }) {
  return (
    <div>
      <div className="text-[12px] text-[var(--ink-soft)]">Mission {index + 1} of {MISSIONS.length}</div>
      <h2>{MISSIONS[index].title}</h2>
    </div>
  )
}

function MissionTablet({ index, best, total, status }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <div><div className="muted text-[12px]">Now</div><b className="text-[var(--ink-strong)]">{status}</b></div>
      <div className="text-right"><div className="muted text-[12px]">Best on Mission {index + 1}</div><Stars n={best} size={18} /></div>
    </div>
  )
}

function DoneButtons({ onNext, onReplay, nextLabel }) {
  return (
    <>
      {onNext && <button className="pill" onClick={onNext}>{nextLabel || <>Next <span className="hl">mission</span> <Icon name="right" size={18} strokeWidth={2.6} /></>}</button>}
      <button className="btn-ghost-dark" onClick={onReplay}>Play again</button>
    </>
  )
}

/** End-of-mission link into the free-play Lab. */
function TryLab({ text, onClick }) {
  return (
    <div className="trylab">
      <span className="tile-ico photon"><Icon name="flask" size={22} /></span>
      <span className="flex-1">{text}</span>
      <button className="btn-ghost-dark" onClick={onClick}>Try it in the Lab <Icon name="right" size={18} strokeWidth={2.6} /></button>
    </div>
  )
}

function CheatSheet({ small }) {
  const s = small ? 20 : 30
  return (
    <div className={`grid grid-cols-2 gap-2 ${small ? '' : 'max-w-md mx-auto'}`}>
      {['+', 'x'].map((f) => (
        <div key={f} className={small ? 'rounded-lg bg-[var(--tint)] border-2 border-[var(--line)] px-3 py-2' : 'panel p-3 text-center'}>
          <Glasses filter={f} size={small ? 34 : 56} label={!small} />
          {[0, 1].map((b) => (
            <div key={b} className={`flex items-center gap-1.5 ${small ? 'text-[12px]' : 'justify-center text-[15px] mt-1'}`}>
              <Photon filter={f} bit={b} size={s} width={small ? 2.5 : 3.5} /> = <b>{b}</b>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function ErrorLine({ text }) {
  return text ? <div className="note bad" role="alert">{text}</div> : null
}

/* ---------------- Mission 1: read the light sticks ---------------- */

function Mission1({ head, tablet, onDone, onNext, onReplay }) {
  const [phase, setPhase] = useState('learn')
  const [rounds] = useState(() => Array.from({ length: 6 }, () => [randFilter(), coin()]))
  const [r, setR] = useState(0)
  const [ans, setAns] = useState(null)
  const [score, setScore] = useState(0)
  const [tries, setTries] = useState({ '+': [], x: [] })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [stars, setStars] = useState(0)

  const [f, b] = rounds[r]
  const answer = (v) => {
    setAns(v)
    if (v === b) setScore((s) => s + 1)
  }
  const nextRound = () => {
    if (r === rounds.length - 1) setPhase('wrong')
    else { setR(r + 1); setAns(null) }
  }
  const look = async (glasses) => {
    setBusy(true); setErr(null)
    try {
      const { bob_bit } = await measureOnce(0, '+', glasses)
      setTries((t) => ({ ...t, [glasses]: [...t[glasses], bob_bit] }))
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const finish = () => {
    const s = score === 6 ? 3 : score >= 4 ? 2 : 1
    setStars(s); onDone(s); setPhase('done')
  }

  let left, screen, status
  if (phase === 'learn') {
    status = 'Learn the glasses'
    left = (<>
      <Bubble who="alice">Each light stick is a <b>number</b>. Which way it points tells you if it's a 0 or a 1. Look at the cheat sheet, then help Bob read my sticks!</Bubble>
      <div className="mt-auto pt-2"><button className="pill" onClick={() => setPhase('rounds')}>I'm <span className="hl">ready!</span></button></div>
    </>)
    screen = (<div className="screen-pad pop"><h3 className="text-center">Cheat sheet: what the sticks mean</h3><CheatSheet /><p className="text-center text-[12px] muted mt-3">+ glasses read the straight sticks. × glasses read the slanted sticks.</p></div>)
  } else if (phase === 'rounds') {
    status = `Stick ${r + 1} of 6 · ${score} right`
    left = (<>
      <Bubble who="bob">Help me read Alice's sticks! Which <b>number</b> is this one? Peek at the cheat sheet if you forget.</Bubble>
      <CheatSheet small />
      <div className="mt-auto pt-2">{ans != null && <button className="pill" onClick={nextRound}>{r === rounds.length - 1 ? <>Next <span className="hl">challenge</span> <Icon name="right" size={18} strokeWidth={2.6} /></> : <>Next <span className="hl">stick</span> <Icon name="right" size={18} strokeWidth={2.6} /></>}</button>}</div>
    </>)
    screen = (
      <div className="screen-pad text-center" key={r}>
        <div className="muted text-[12px]">Stick {r + 1} of 6</div>
        <div className="pop my-2 inline-block panel px-8 py-4"><Photon filter={f} bit={b} size={80} width={6} color="#16133A" /></div>
        <div className="text-[13px]">Bob reads it with the right glasses: <Glasses filter={f} size={44} label={false} /></div>
        <div className="flex justify-center gap-4 mt-3">
          {[0, 1].map((v) => (
            <button key={v} disabled={ans != null} onClick={() => answer(v)}
              className={`big-choice ${ans != null && v === b ? 'right' : ''} ${ans === v && v !== b ? 'wrong shake' : ''}`}>{v}</button>
          ))}
        </div>
        {ans != null && (
          <p className={`mt-3 font-bold pop ${ans === b ? 'text-[var(--good)]' : 'text-[var(--bad)]'}`}>
            {ans === b ? 'Yes! ' : 'Oops! '}With {f === '+' ? '+' : '×'} glasses, <Photon filter={f} bit={b} size={18} /> means {b}.
          </p>
        )}
      </div>
    )
  } else if (phase === 'wrong') {
    status = `${tries['+'].length + tries.x.length} looks so far`
    const ready = tries['+'].length >= 2 && tries.x.length >= 3
    left = (<>
      <Bubble who="bob">Now the tricky part! Alice sent this stick: <Photon filter="+" bit={0} size={18} /> (a <b>0</b>, made with + glasses). Press each button a few times. What happens with the <b>wrong</b> glasses?</Bubble>
      <ErrorLine text={err} />
      <div className="mt-auto pt-2"><button className="pill" disabled={!ready} onClick={finish}>{ready ? <>I <span className="hl">get it!</span></> : 'Try both glasses…'}</button></div>
    </>)
    screen = (
      <div className="screen-pad">
        <div className="text-center mb-3"><span className="muted text-[12px]">Alice sent:</span> <span className="panel inline-block px-3 py-1"><Photon filter="+" bit={0} size={34} width={4} /></span> <span className="muted text-[12px]">= 0</span></div>
        <div className="grid grid-cols-2 gap-3">
          {['+', 'x'].map((g) => (
            <div key={g} className="panel p-3 text-center">
              <button className="big-choice text-[14px]" disabled={busy} onClick={() => look(g)}>
                <Glasses filter={g} size={46} label={false} /><div className="text-[12px] mt-1">Look with {g === '+' ? '+' : '×'} glasses</div>
              </button>
              <div className="mt-2 flex flex-wrap justify-center gap-1 min-h-[28px]">
                {tries[g].map((v, i) => <span key={i} className={`pop inline-flex w-7 h-7 rounded-full items-center justify-center font-bold text-white ${v === 0 ? 'bg-[var(--good)]' : 'bg-[var(--bad)]'}`}>{v}</span>)}
              </div>
              <div className="text-[12px] mt-1 font-semibold">
                {tries[g].length >= 2 && (g === '+' ? 'Always 0. The right glasses never lie!' : tries[g].includes(1) && tries[g].includes(0) ? 'Sometimes 0, sometimes 1: a coin flip!' : 'Keep pressing…')}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] muted text-center mt-2 mb-0">Every answer comes from a real quantum simulation (Qiskit), not a dice roll we programmed.</p>
      </div>
    )
  } else {
    status = 'Done!'
    left = (<>
      <Bubble who="alice">Great job! You read {score} of 6 sticks right. Now you know the big secret of BB84.</Bubble>
      <div className="mt-auto pt-2 flex flex-wrap gap-3 items-center"><DoneButtons onNext={onNext} onReplay={onReplay} /></div>
    </>)
    screen = (<div className="screen-pad"><Celebrate stars={stars} title="Light stick reader">The <b>right glasses</b> always give the right number. The <b>wrong glasses</b> give a coin flip. Remember this: it's how Bob builds a key and how Eve gets caught!</Celebrate></div>)
  }
  return <Stage left={<>{head}{left}</>} screen={screen} tablet={tablet(status)} />
}

/* ---------------- Mission 2: be Bob, make a key ---------------- */

const N2 = 8

function Mission2({ head, tablet, onDone, onNext, onReplay, onLab }) {
  const [alice] = useState(() => ({ bits: Array.from({ length: N2 }, coin), filters: Array.from({ length: N2 }, randFilter) }))
  const [phase, setPhase] = useState('intro')
  const [picks, setPicks] = useState([])
  const [run, setRun] = useState(null)
  const [tapped, setTapped] = useState(() => new Set())
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [stars, setStars] = useState(0)

  const P = run?.photons
  const same = P ? P.map((p) => p.same_filter) : []
  const mistakes = P ? same.filter((s, i) => s !== tapped.has(i)).length : 0
  const key = P ? P.filter((p) => p.same_filter) : []

  const pick = (f) => setPicks((p) => (p.length < N2 ? [...p, f] : p))
  const send = async () => {
    setBusy(true); setErr(null)
    try {
      const r = await runBB84({ alice_bits: alice.bits, alice_filters: alice.filters, bob_filters: picks, check_percent: 25 })
      setRun(r); setPhase('read')
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const toggle = (i) => {
    if (checked) return
    setTapped((t) => { const n = new Set(t); if (n.has(i)) n.delete(i); else n.add(i); return n })
  }
  const check = () => { setChecked(true); setStars(starsFor(mistakes)) }
  const finish = () => { onDone(stars); setPhase('done') }

  const cellCls = (i) => {
    if (phase === 'key' || phase === 'done') return same[i] ? 'ok' : 'dim'
    if (!checked) return `tap ${tapped.has(i) ? 'picked' : ''}`
    if (same[i] && tapped.has(i)) return 'ok'
    if (same[i]) return 'miss'
    if (tapped.has(i)) return 'bad'
    return ''
  }
  const showAlice = ['compare', 'key', 'done'].includes(phase)

  const table = P && (
    <table className="gtable mx-auto">
      <tbody>
        <tr><th>Photon</th>{P.map((p, i) => <td key={i} className={cellCls(i)} onClick={() => phase === 'compare' && toggle(i)}>{p.index}</td>)}</tr>
        {showAlice && <tr className="pop"><th>Alice's glasses</th>{P.map((p, i) => <td key={i} className={phase !== 'compare' ? cellCls(i) : ''}><GlassTag filter={p.alice_filter} /></td>)}</tr>}
        <tr><th>Bob's glasses</th>{P.map((p, i) => <td key={i} className={phase !== 'compare' && showAlice ? cellCls(i) : ''}><GlassTag filter={p.bob_filter} /></td>)}</tr>
        <tr><th>Bob saw</th>{P.map((p, i) => <td key={i} className={phase !== 'compare' && showAlice ? cellCls(i) : ''}><Photon filter={p.bob_filter} bit={p.bob_bit} size={20} /></td>)}</tr>
        <tr><th>Bob's number</th>{P.map((p, i) => <td key={i} className={phase !== 'compare' && showAlice ? cellCls(i) : ''}>{p.bob_bit}</td>)}</tr>
        {phase === 'compare' && <tr><th>Same glasses?</th>{P.map((p, i) => <td key={i} className={cellCls(i)} onClick={() => toggle(i)}>{checked ? <Icon name={same[i] ? 'check' : 'x'} size={18} /> : tapped.has(i) ? <Icon name="check" size={18} /> : ''}</td>)}</tr>}
        {(phase === 'key' || phase === 'done') && <tr className="pop"><th>Alice's number</th>{P.map((p, i) => <td key={i} className={cellCls(i)}>{p.alice_bit}</td>)}</tr>}
      </tbody>
    </table>
  )

  let left, screen, status
  if (phase === 'intro') {
    status = 'Get ready'
    left = (<>
      <Bubble who="alice">I'm sending you <b>8 photons</b>. For each one I picked a random number and random glasses, and I'm keeping my glasses <b>secret</b> for now!</Bubble>
      <Bubble who="bob">I'll pick my glasses at random too. <b>You choose for me!</b></Bubble>
      <div className="mt-auto pt-2"><button className="pill" onClick={() => setPhase('pick')}>Let's <span className="hl">go!</span></button></div>
    </>)
    screen = (<div className="screen-pad text-center pop">
      <div className="flex items-center gap-3 mt-6 px-4"><Avatar who="alice" size={64} /><div className="channel"><span className="fly" /></div><Avatar who="bob" size={64} /></div>
      <div className="flex justify-center gap-1.5 mt-6">{Array.from({ length: N2 }, (_, i) => <Mystery key={i} size={28} />)}</div>
      <p className="text-[13px] mt-4">8 photons are on their way. Bob can't see which way they point until he looks through his glasses.</p>
    </div>)
  } else if (phase === 'pick') {
    const i = picks.length
    status = `Picked ${i} of ${N2}`
    left = (<>
      <Bubble who="bob">{i < N2 ? <>Photon <b>{i + 1}</b> is here! Which glasses should I wear? There's no wrong answer: just pick one.</> : <>All 8 picked! Let's <b>look</b> at the photons.</>}</Bubble>
      <ErrorLine text={err} />
      <div className="mt-auto pt-2 flex flex-wrap gap-3 items-center">
        {i === N2 && <button className="pill" disabled={busy} onClick={send}>{busy ? 'Looking…' : <>Look at the <span className="hl">photons</span></>}</button>}
        {i < N2 && <button className="btn-ghost-dark" onClick={() => setPicks((p) => [...p, ...Array.from({ length: N2 - p.length }, randFilter)])}>Pick the rest for me</button>}
        {i > 0 && <button className="btn-ghost-dark" onClick={() => setPicks((p) => p.slice(0, -1))}>Undo</button>}
      </div>
    </>)
    screen = (<div className="screen-pad text-center">
      {i < N2 ? (<>
        <div className="muted text-[12px]">Photon {i + 1} of {N2}</div>
        <div className="my-3" key={i}><span className="pop inline-block"><Mystery size={60} /></span></div>
        <div className="flex justify-center gap-4">
          {['+', 'x'].map((f) => <button key={f} className="big-choice" onClick={() => pick(f)}><Glasses filter={f} size={60} /></button>)}
        </div>
      </>) : <p className="mt-10 text-[15px] font-bold text-[var(--ink-strong)] pop">Ready! Press “Look at the photons”.</p>}
      <div className="flex justify-center gap-1.5 mt-5 flex-wrap">
        {Array.from({ length: N2 }, (_, k) => (
          <div key={k} className={`slot ${k === i ? 'cur' : ''} ${k < i ? 'filled' : ''}`}>
            <span className="muted">{k + 1}</span>{k < i ? <GlassTag filter={picks[k]} /> : <Mystery size={18} label="" />}
          </div>
        ))}
      </div>
    </div>)
  } else if (phase === 'read') {
    status = 'Bob wrote down 8 numbers'
    left = (<>
      <Bubble who="bob">I looked at every photon and wrote down a number. But some of them are just <b>coin-flip guesses</b>, from when I wore the wrong glasses. Which ones? I can't tell yet!</Bubble>
      <div className="mt-auto pt-2"><button className="pill" onClick={() => setPhase('compare')}>Call <span className="hl">Alice</span> <Icon name="right" size={18} strokeWidth={2.6} /></button></div>
    </>)
    screen = <div className="screen-pad pop"><h3 className="text-center">What Bob saw</h3>{table}</div>
  } else if (phase === 'compare') {
    status = checked ? `${mistakes === 0 ? 'Perfect!' : `${mistakes} mistake${mistakes > 1 ? 's' : ''}`}` : `${tapped.size} tapped`
    left = (<>
      <Bubble who="alice">I'll tell Bob which <b>glasses</b> I used, out loud. That's safe: glasses don't give away the numbers!</Bubble>
      <div className={`note ${checked && mistakes === 0 ? 'good' : 'info'}`}>
        {checked
          ? mistakes === 0 ? <><Icon name="sparkle" size={18} className="text-[var(--check)]" /> Perfect! You found every match.</> : <><b className="text-[var(--good)]">Green</b> = right. <b className="text-[var(--check)]">Orange</b> = a match you missed. <b className="text-[var(--bad)]">Red</b> = the glasses were different.</>
          : <><b>Your job:</b> tap every photon where Alice and Bob wore the <b>same</b> glasses.</>}
      </div>
      <div className="mt-auto pt-2">
        {!checked
          ? <button className="pill" onClick={check}>Check my <span className="hl">answers</span></button>
          : <button className="pill" onClick={() => setPhase('key')}>Keep the <span className="hl">matches</span> <Icon name="right" size={18} strokeWidth={2.6} /></button>}
      </div>
    </>)
    screen = <div className="screen-pad"><h3 className="text-center">Tap the photons with matching glasses</h3>{table}</div>
  } else {
    const done = phase === 'done'
    status = done ? 'Done!' : `${key.length} key numbers`
    left = (<>
      {key.length > 0
        ? <Bubble who="alice">We keep only the photons with <b>matching glasses</b>, because Bob read those perfectly. Look: my numbers are the same as Bob's! We never said the numbers out loud, so nobody else knows our key.</Bubble>
        : <Bubble who="bob">Oh no, our glasses never matched this time! That's very rare. Let's play again.</Bubble>}
      <div className="mt-auto pt-2 flex flex-wrap gap-3 items-center">
        {!done && key.length > 0 && <button className="pill" onClick={finish}>Finish <span className="hl">mission</span></button>}
        {(done || key.length === 0) && <DoneButtons onNext={done ? onNext : null} onReplay={onReplay} />}
      </div>
    </>)
    screen = (<div className="screen-pad">
      {done
        ? <>
          <Celebrate stars={stars} title="Key maker">You and Bob made the secret key <span className="keybox text-[15px]">{key.map((p) => p.bob_bit).join('')}</span>. Photons kept: {key.length} of 8. That's about half, just like in real BB84!</Celebrate>
          <TryLab text={<>Make a much longer key in the <b>Photon Lab</b>, with up to 256 photons.</>} onClick={() => onLab('simulator')} />
        </>
        : <>{table}<div className="text-center mt-3 pop"><div className="text-[12px] muted mb-1">Your secret key</div><span className="keybox">{key.map((p) => p.bob_bit).join('') || '—'}</span></div></>}
    </div>)
  }
  return <Stage left={<>{head}{left}</>} screen={screen} tablet={tablet(status)} />
}

/* ---------------- Mission 3: spy hunt ---------------- */

const CASES = 3
const N3 = 96

function Mission3({ head, tablet, onDone, onNext, onReplay, onLab }) {
  const [plan] = useState(() => [true, false, Math.random() < 0.5].sort(() => Math.random() - 0.5))
  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState('send') // send, compare, reveal, done
  const [run, setRun] = useState(null)
  const [shown, setShown] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [right, setRight] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [stars, setStars] = useState(0)

  const evePresent = plan[round]
  const checks = run ? run.photons.filter((p) => p.is_check) : []
  const wrong = checks.filter((p) => p.error).length
  const spyEvidence = run ? run.estimated_qber > 0.11 : false

  const send = async () => {
    setBusy(true); setErr(null)
    try {
      const [r] = await Promise.all([
        runBB84({ n_photons: N3, eve_on: evePresent, eve_percent: 100, check_percent: 50 }),
        new Promise((res) => setTimeout(res, 1200)),
      ])
      setRun(r); setShown(false); setAnswer(null); setPhase('compare')
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const decide = (saysSpy) => {
    setAnswer(saysSpy)
    if (saysSpy === spyEvidence) setRight((n) => n + 1)
    setPhase('reveal')
  }
  const next = () => {
    if (round === CASES - 1) {
      const s = Math.max(1, right)
      setStars(s); onDone(s); setPhase('done')
    } else { setRound(round + 1); setRun(null); setPhase('send') }
  }

  const rule = <div className="note warn"><Icon name="search" size={18} /> <b>Detective rule:</b> if more than <b>1 in every 10</b> checked numbers are different, a spy was listening.</div>

  let left, screen
  const status = phase === 'done' ? 'Done!' : `Case ${round + 1} of ${CASES} · ${right} solved`
  if (phase === 'send') {
    left = (<>
      <Bubble who="bob">Detective, we need you! Alice will send me <b>{N3} photons</b>. Maybe Eve is hiding in the middle, maybe not. You'll find out from the <b>mistakes</b>.</Bubble>
      {rule}
      <ErrorLine text={err} />
      <div className="mt-auto pt-2"><button className="pill" disabled={busy} onClick={send}>{busy ? 'Sending…' : <>Send <span className="hl">photons</span></>}</button></div>
    </>)
    screen = (<div className="screen-pad text-center">
      <div className="muted text-[12px]">Case {round + 1} of {CASES}</div>
      <div className="flex items-center gap-3 mt-8 px-4">
        <Avatar who="alice" size={64} />
        <div className="channel">{busy && <span className="fly" />}<div className="absolute left-1/2 -translate-x-1/2 -top-12 text-[var(--good)]" aria-hidden><Icon name="tree" size={42} strokeWidth={2.2} /></div><div className="absolute left-1/2 -translate-x-1/2 -top-16 font-bold text-[18px] text-[var(--eve)]">?</div></div>
        <Avatar who="bob" size={64} />
      </div>
      <p className="text-[13px] mt-8">Is Eve hiding behind the tree? You can't see her. You can only look at the numbers.</p>
    </div>)
  } else {
    const pct = run ? Math.round((run.estimated_qber || 0) * 100) : 0
    left = (<>
      {phase === 'compare' && !shown && <Bubble who="alice">Bob and I kept <b>{run.kept_count}</b> photons with matching glasses. Now we read <b>{checks.length}</b> of our numbers out loud to compare them.</Bubble>}
      {phase === 'compare' && shown && <Bubble who="bob">We found <b>{wrong}</b> different number{wrong === 1 ? '' : 's'} out of {checks.length}. Detective, what do you think?</Bubble>}
      {phase === 'reveal' && (evePresent
        ? <Bubble who="eve">{spyEvidence ? <>Argh, you caught me! My wrong guesses <b>bent the sticks</b>, and that made mistakes.</> : <>Hehe, I was here, but I got <b>lucky</b>: none of my mistakes were checked! With more photons I'd be caught.</>}</Bubble>
        : <Bubble who="bob">No spy this time! Every checked number matched, so our key is <b>safe to use</b>.</Bubble>)}
      {rule}
      {phase === 'reveal' && (
        <div className={`note pop font-bold ${answer === spyEvidence ? 'good' : 'bad'}`}>
          {answer === spyEvidence ? <><Icon name="check" size={18} /> Good detective work!</> : <><Icon name="x" size={18} /> Not quite: {pct}% different means {spyEvidence ? 'a spy was there' : 'no sign of a spy'}.</>}
        </div>
      )}
      <div className="mt-auto pt-2 flex flex-wrap gap-3 items-center">
        {phase === 'compare' && !shown && <button className="pill" onClick={() => setShown(true)}>Compare <span className="hl">out loud</span></button>}
        {phase === 'compare' && shown && (<>
          <button className="pill" onClick={() => decide(true)}>A <span className="hl">spy</span> was here!</button>
          <button className="btn-ghost-dark" onClick={() => decide(false)}>No spy</button>
        </>)}
        {phase === 'reveal' && <button className="pill" onClick={next}>{round === CASES - 1 ? <>See my <span className="hl">stars</span></> : <>Next <span className="hl">case</span> <Icon name="right" size={18} strokeWidth={2.6} /></>}</button>}
        {phase === 'done' && <DoneButtons onNext={onNext} onReplay={onReplay} />}
      </div>
    </>)
    screen = phase === 'done'
      ? <div className="screen-pad">
        <Celebrate stars={stars} title="Spy hunter">You solved {right} of {CASES} cases. A greedy Eve can't hide: when she peeks at every photon, about <b>1 in 4</b> checked numbers comes out wrong, far more than the 1-in-10 detective rule. But a <b>clever</b> Eve who peeks at fewer photons can hide under the line.</Celebrate>
        <TryLab text={<>Can you catch a <b>clever Eve</b>? She's waiting in the <b>Spy Lab</b>.</>} onClick={() => onLab('eve')} />
      </div>
      : (
        <div className="screen-pad">
          <h3 className="text-center">Checked numbers: Alice vs Bob</h3>
          <div className="overflow-x-auto">
            <table className="gtable mx-auto">
              <tbody>
                <tr><th>Alice says</th>{checks.map((p) => <td key={p.index}>{p.alice_bit}</td>)}</tr>
                <tr><th>Bob says</th>{checks.map((p) => <td key={p.index} className={shown && p.error ? 'bad' : shown ? 'ok' : ''}>{shown ? p.bob_bit : '?'}</td>)}</tr>
              </tbody>
            </table>
          </div>
          {shown && (
            <div className="max-w-sm mx-auto mt-4 pop">
              <div className="flex justify-between text-[12px] mb-1"><span>Different: <b>{wrong} of {checks.length}</b></span><b style={{ color: spyEvidence ? 'var(--bad)' : 'var(--good)' }}>{pct}%</b></div>
              <div className="meter"><i style={{ width: `${Math.min(pct / 50, 1) * 100}%`, background: spyEvidence ? 'var(--bad)' : 'var(--good)' }} /><span className="limit" style={{ left: '22%' }} /></div>
              <div className="flex justify-between text-[10px] muted mt-0.5"><span>0</span><span style={{ marginLeft: '8%' }}>spy line (1 in 10)</span><span>half</span></div>
            </div>
          )}
          {phase === 'reveal' && (
            <div className="flex items-center justify-center gap-2 mt-4 pop">
              {evePresent ? <><Avatar who="eve" size={52} /><span className="font-bold text-[var(--eve)]">Eve was here!</span></> : <span className="font-bold text-[var(--good)]">Nobody was behind the tree.</span>}
            </div>
          )}
        </div>
      )
  }
  return <Stage left={<>{head}{left}</>} screen={screen} tablet={tablet(status)} />
}

/* ---------------- Mission 4: secret message ---------------- */

const printable = (bits) => { const v = parseInt(bits.join(''), 2); return v > 32 && v < 127 ? String.fromCharCode(v) : '▒' }

function LetterTable({ m, rows }) {
  const bytes = { code: toBytes(m.bits), key: toBytes(m.ka), locked: toBytes(m.locked), bobkey: toBytes(m.kb), back: toBytes(m.unlocked) }
  const letters = toBytes(m.bits).map(printable)
  const label = { code: 'Letter code', key: "Alice's key", locked: 'Locked', bobkey: "Bob's key", back: 'Unlocked' }
  return (
    <div className="overflow-x-auto">
      <table className="gtable mx-auto">
        <tbody>
          <tr><th>Letter</th>{letters.map((l, i) => <td key={i} className="text-[18px]">{l}</td>)}</tr>
          {rows.map((r) => (
            <tr key={r} className="pop">
              <th>{label[r]}</th>
              {bytes[r].map((b, i) => (
                <td key={i} className="bits px-1 w-auto font-normal text-[12px]">
                  {b.map((bit, j) => {
                    const flip = (r === 'locked' && bytes.key[i][j] === 1) || (r === 'back' && bytes.bobkey[i][j] === 1)
                    return <span key={j} className={flip ? 'text-[var(--cyan)] font-bold' : ''}>{bit}</span>
                  })}
                </td>
              ))}
            </tr>
          ))}
          {rows.includes('back') && <tr className="pop"><th>Bob reads</th>{toBytes(m.unlocked).map((b, i) => <td key={i} className="text-[18px] ok">{printable(b)}</td>)}</tr>}
        </tbody>
      </table>
    </div>
  )
}

function Mission4({ head, tablet, onDone, onNext, onReplay }) {
  const [phase, setPhase] = useState('make')
  const [run, setRun] = useState(null)
  const [word, setWord] = useState('HI')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const m = run ? lockMessage(run, word) : null
  const cap = m ? Math.min(8, m.capacity) : 0
  const make = async () => {
    setBusy(true); setErr(null)
    try {
      const r = await runBB84({ n_photons: 128, check_percent: 25 })
      setRun(r); setPhase('write')
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const status = { make: 'Make a long key', write: 'Write a word', lock: 'Lock it', eve: 'Eve grabs it', unlock: 'Bob unlocks it', done: 'Done!' }[phase]

  let left, screen
  if (phase === 'make') {
    left = (<>
      <Bubble who="alice">To lock a message I need a <b>long</b> key: <b>8 numbers for every letter</b>! Let's send 128 photons, the same way you did in Mission 2.</Bubble>
      <ErrorLine text={err} />
      <div className="mt-auto pt-2"><button className="pill" disabled={busy} onClick={make}>{busy ? 'Sending…' : <>Make a long <span className="hl">key</span></>}</button></div>
    </>)
    screen = (<div className="screen-pad text-center">
      <div className="flex items-center gap-3 mt-8 px-4"><Avatar who="alice" size={64} /><div className="channel">{busy && <span className="fly" />}</div><Avatar who="bob" size={64} /></div>
      <p className="text-[13px] mt-8">Every letter of a message is stored as 8 zeros and ones. So a 3-letter word needs 24 key numbers.</p>
    </div>)
  } else if (phase === 'write') {
    const tooLong = m.need > m.keyBits || word.length > cap
    left = (<>
      <Bubble who="bob">We have a key with <b>{m.keyBits} numbers</b>. That's enough for <b>{cap} letters</b>. Type a secret word for Alice to send me!</Bubble>
      <label className="text-[13px]">Secret word (up to {cap} letters)
        <input className="field-dark w-full mt-1 text-[20px] tracking-widest uppercase" maxLength={cap} value={word}
          onChange={(e) => setWord(e.target.value.replace(/[^a-zA-Z0-9 !?]/g, '').toUpperCase())} />
      </label>
      <div className="mt-auto pt-2"><button className="pill" disabled={!word.trim() || tooLong} onClick={() => setPhase('lock')}>Lock <span className="hl">it!</span></button></div>
    </>)
    screen = (<div className="screen-pad">
      <div className="text-center mb-3"><div className="text-[12px] muted mb-1">Your key (first numbers)</div><span className="keybox text-[14px] tracking-[2px]">{run.alice_key.slice(0, 24).join('')}…</span></div>
      <h3 className="text-center">Each letter becomes 8 numbers</h3>
      {m.fits ? <LetterTable m={m} rows={['code']} /> : <p className="text-center muted">Type a word on the left.</p>}
    </div>)
  } else {
    const rows = { lock: ['code', 'key', 'locked'], eve: ['code', 'key', 'locked'], unlock: ['locked', 'bobkey', 'back'], done: ['locked', 'bobkey', 'back'] }[phase]
    const garbled = toBytes(m.locked).map(printable).join('')
    left = (<>
      {phase === 'lock' && <Bubble who="alice">Here's the trick: where the key has a <b>1</b>, I <b>flip</b> the number (0 becomes 1, 1 becomes 0). Where the key has a <b>0</b>, I leave it. The blue numbers got flipped!</Bubble>}
      {phase === 'eve' && <Bubble who="eve">I grabbed the locked message! It says… <b>“{garbled}”</b>?! Without the key it's just <b>nonsense</b>. No fair!</Bubble>}
      {(phase === 'unlock' || phase === 'done') && <Bubble who="bob">I flip the same places with <b>my</b> key and… I can read it: <b>“{m.bobText}”</b>! Flipping twice brings the message back.</Bubble>}
      <div className="mt-auto pt-2 flex flex-wrap gap-3 items-center">
        {phase === 'lock' && <button className="pill" onClick={() => setPhase('eve')}>Send it to <span className="hl">Bob</span></button>}
        {phase === 'eve' && <button className="pill" onClick={() => setPhase('unlock')}>Bob, <span className="hl">unlock it!</span></button>}
        {phase === 'unlock' && <button className="pill" onClick={() => { onDone(3); setPhase('done') }}>Finish <span className="hl">mission</span></button>}
        {phase === 'done' && <DoneButtons onNext={onNext} onReplay={onReplay} nextLabel={<>Take the <span className="hl">Boss Quiz</span> <Icon name="right" size={18} strokeWidth={2.6} /></>} />}
      </div>
    </>)
    screen = phase === 'done'
      ? <div className="screen-pad"><Celebrate stars={3} title="Secret messenger">Bob read <b>“{m.bobText}”</b>, but Eve only saw <span className="bits">{toBytes(m.locked).map(byteHex).join(' ')}</span>. A key made with photons, used only once, makes a lock nobody can pick.</Celebrate></div>
      : (<div className="screen-pad">
        <h3 className="text-center">{phase === 'unlock' ? 'Bob flips the same places back' : 'Locking the word with the key'}</h3>
        <LetterTable m={m} rows={rows} />
        {phase === 'eve' && <div className="flex items-center justify-center gap-2 mt-3 pop"><Avatar who="eve" size={44} /><div className="bubble eve max-w-xs"><div className="bubble-name">Eve sees</div><span className="bits text-[16px]">{garbled}</span></div></div>}
      </div>)
  }
  return <Stage left={<>{head}{left}</>} screen={screen} tablet={tablet(status)} />
}

/* ---------------- container ---------------- */

const COMPONENTS = [Mission1, Mission2, Mission3, Mission4]

export function Missions({ mission, setMission, stars, setStar, totalStars, onQuiz, onLab }) {
  const [attempt, setAttempt] = useState(0)
  const C = COMPONENTS[mission]
  const id = MISSIONS[mission].id
  const head = <MissionHead index={mission} />
  const tablet = (status) => <MissionTablet index={mission} best={stars[id] || 0} total={totalStars} status={status} />
  const onNext = mission < MISSIONS.length - 1 ? () => { setMission(mission + 1); setAttempt((a) => a + 1) } : onQuiz
  return (
    <C key={`${mission}-${attempt}`} head={head} tablet={tablet} onDone={(n) => setStar(id, n)} onNext={onNext}
      onReplay={() => setAttempt((a) => a + 1)} onLab={onLab} />
  )
}
