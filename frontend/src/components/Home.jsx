import { Avatar } from './Characters.jsx'
import { Icon } from './Icons.jsx'
import { MISSIONS } from './Missions.jsx'

/* ---------- The Learn path: Story → Missions 1–4 → Boss Quiz ---------- */

/** Builds the 6 stops of the Learn path from saved progress. */
export function learnStops({ stars, storyDone, unlocked }) {
  return [
    { id: 'story', label: 'Story', icon: 'book', title: 'Meet Alice, Bob and Eve', done: storyDone },
    ...MISSIONS.map((m, i) => ({ id: m.id, mission: i, label: `Mission ${i + 1}`, num: String(i + 1), title: m.title, done: (stars[m.id] || 0) > 0, locked: !unlocked(i) })),
    { id: 'quiz', label: 'Boss Quiz', icon: 'trophy', title: 'Five questions, up to 3 stars', done: (stars.quiz || 0) > 0 },
  ]
}

/** The first stop that isn't done yet (or the story again when everything is done). */
export function nextStop(stops) {
  return stops.find((s) => !s.done && !s.locked) || stops[0]
}

function PathBar({ done, total }) {
  return (
    <div className="pathbar" role="progressbar" aria-label="Learn path progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}
      aria-valuetext={`${done} of ${total} done`}>
      <i style={{ width: `${(done / total) * 100}%` }} />
    </div>
  )
}

function Stops({ stops, current, onGo }) {
  return (
    <ol className="stops">
      {stops.map((s, i) => {
        const here = i === current
        return (
          <li key={s.id} className={stops[i - 1]?.done ? 'after-done' : ''}>
            <button type="button" className={`stop ${here ? 'here' : ''} ${s.done ? 'done' : ''}`} disabled={s.locked}
              aria-current={here ? 'step' : undefined} title={s.locked ? 'Finish the mission before to unlock' : s.title}
              aria-label={`${s.label}: ${s.title}${s.done ? ' (done)' : s.locked ? ' (locked)' : ''}`} onClick={() => onGo(s)}>
              <span className="dot" aria-hidden>{s.done ? <Icon name="check" size={18} strokeWidth={3} /> : s.locked ? <Icon name="lock" size={15} /> : s.icon ? <Icon name={s.icon} size={17} /> : s.num}</span>
              <span className="lbl" aria-hidden>{s.label}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/** Shown above Story, Missions and Boss Quiz, so the three feel like one path. */
export function LearnPath({ stops, current, onGo }) {
  const done = stops.filter((s) => s.done).length
  return (
    <nav className="card learnpath" aria-label="Learn path">
      <div className="flex items-baseline justify-between gap-3">
        <b className="text-[var(--ink-strong)]">Your learning path</b>
        <span className="text-[13px] muted tabular-nums">{done} of {stops.length} done</span>
      </div>
      <PathBar done={done} total={stops.length} />
      <Stops stops={stops} current={current} onGo={onGo} />
    </nav>
  )
}

/* ---------- The Lab: Photon Lab and Spy Lab ---------- */

const LABS = [
  { id: 'simulator', name: 'Photon Lab', icon: 'photon', tone: 'plus', what: 'Send photons and watch the key appear, one step at a time.' },
  { id: 'eve', name: 'Spy Lab', icon: 'spy', tone: 'eve', what: 'Let Eve listen and see how Alice and Bob catch her.' },
]

/** Switch between the two labs. Shared settings (Eve %, noise) are shown inside each lab. */
export function LabTabs({ tab, setTab }) {
  return (
    <nav className="labtabs" aria-label="Lab">
      {LABS.map((l) => (
        <button key={l.id} type="button" className={`labtab ${tab === l.id ? 'here' : ''}`} aria-current={tab === l.id ? 'page' : undefined} onClick={() => setTab(l.id)}>
          <span className={`tile-ico ${l.tone}`} aria-hidden><Icon name={l.icon} size={22} /></span>
          <span><b>{l.name}</b><span className="what">{l.what}</span></span>
        </button>
      ))}
    </nav>
  )
}

/* ---------- Home ---------- */

export function Home({ stops, totalStars, onGo, onLab }) {
  const done = stops.filter((s) => s.done).length
  const next = nextStop(stops)
  const fresh = done === 0
  const finished = done === stops.length
  return (
    <div className="space-y-5">
      <section className="hero" aria-labelledby="home-title">
        <div className="scene" aria-hidden>
          <div className="flex flex-col items-center gap-1"><Avatar who="alice" size={72} /><b>Alice</b></div>
          <div className="channel"><span className="fly" /></div>
          <div className="flex flex-col items-center gap-1"><Avatar who="bob" size={72} /><b>Bob</b></div>
          <div className="peek"><Avatar who="eve" size={46} /><span>?</span></div>
        </div>
        <h1 id="home-title">Send a secret key with light</h1>
        <p>
          Alice and Bob want a secret key that nobody else knows. Eve the spy wants to peek.
          Find out how tiny light sticks give her away.
        </p>
      </section>

      <div className="homegrid">
        <section className="card choice learn" aria-labelledby="learn-title">
          <div className="flex items-center gap-3">
            <span className="tile-ico photon" aria-hidden><Icon name="book" size={24} /></span>
            <div>
              <h2 id="learn-title">Learn</h2>
              <p className="m-0 muted">Read the story, play 4 missions, then beat the Boss Quiz.</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="muted">{finished ? 'All done. Great work!' : fresh ? 'Start here if you are new' : `Up next: ${next.label}`}</span>
              <span className="tabular-nums muted">{done} of {stops.length} done · <span className="stars"><Icon name="star" fill size={14} className="on" /></span> {totalStars} / 15</span>
            </div>
            <PathBar done={done} total={stops.length} />
            <Stops stops={stops} current={-1} onGo={onGo} />
          </div>
          <div>
            <button className="pill" onClick={() => onGo(next)}>
              {fresh ? <>Start the <span className="hl">story</span> <Icon name="right" size={18} strokeWidth={2.6} /></> : finished ? <>Read the <span className="hl">story</span> again</> : <>Continue: <span className="hl">{next.label}</span> <Icon name="right" size={18} strokeWidth={2.6} /></>}
            </button>
          </div>
        </section>

        <section className="card choice lab" aria-labelledby="lab-title">
          <div className="flex items-center gap-3">
            <span className="tile-ico" aria-hidden><Icon name="flask" size={24} /></span>
            <div>
              <h2 id="lab-title">Lab</h2>
              <p className="m-0 muted">Free play. Change the settings and run real Qiskit simulations.</p>
            </div>
          </div>
          <div className="grid gap-2">
            {LABS.map((l) => (
              <button key={l.id} type="button" className="labpick" onClick={() => onLab(l.id)}>
                <span className={`tile-ico ${l.tone}`} aria-hidden><Icon name={l.icon} size={22} /></span>
                <span><b>{l.name}</b><span className="what">{l.what}</span></span>
                <Icon name="right" size={22} className="go" />
              </button>
            ))}
          </div>
          <p className="text-[13px] muted m-0">Best after Mission 2, once you know the glasses.</p>
        </section>
      </div>
    </div>
  )
}
