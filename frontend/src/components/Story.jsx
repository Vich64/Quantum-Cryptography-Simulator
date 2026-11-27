import { Avatar, Bubble, Glasses } from './Characters.jsx'
import { Icon } from './Icons.jsx'
import { Photon } from './Photon.jsx'

const PAGES = [
  {
    title: 'Meet Alice and Bob', who: 'alice',
    say: <>Hi! I'm Alice, and this is my friend Bob. We want to share a <b>secret key</b> so we can send each other secret notes.</>,
  },
  {
    title: 'The problem: a spy', who: 'eve',
    say: <>Hehe, I'm Eve! When Alice sends a key over the normal internet, I can <b>copy</b> it. It's like photocopying a note: the copy is perfect, and <b>nobody knows</b> I did it!</>,
  },
  {
    title: 'The quantum trick', who: 'alice',
    say: <>So I use a quantum trick! I send each number on a tiny piece of light called a <b>photon</b>. Think of it as a little <b>light stick</b> that points one way.</>,
  },
  {
    title: 'Magic glasses', who: 'bob',
    say: <>To read a light stick, I put on <b>magic glasses</b>. There are two kinds: <b>+ glasses</b> and <b>× glasses</b>. Each kind reads two of the sticks.</>,
  },
  {
    title: 'Wrong glasses = a guess', who: 'bob',
    say: <>Here's the tricky part: I don't know which glasses Alice used! With the <b>same</b> glasses I read the right number. With the <b>wrong</b> glasses I just get a random answer, like <b>flipping a coin</b>.</>,
  },
  {
    title: 'How Eve gets caught', who: 'eve',
    say: <>Uh oh. To peek, I must wear glasses too, and I have to guess which ones. When I guess wrong, I <b>bend the stick</b>! Then Bob reads some wrong numbers, and they spot my mistakes.</>,
  },
  {
    title: 'You know BB84!', who: 'alice',
    say: <>That's the whole idea! It's called <b>BB84</b>, invented in 1984. A spy always leaves mistakes behind. Ready to try it yourself in the missions?</>,
  },
]
export const STORY_PAGES = PAGES.length

const Arrow = () => <Icon name="arrow" size={22} className="text-[var(--ink-soft)] mx-1" />

function Scene({ page }) {
  switch (page) {
    case 0:
      return (
        <div className="text-center">
          <div className="flex items-center justify-center gap-6 mt-2">
            <div><Avatar who="alice" size={84} /><div className="font-bold">Alice</div></div>
            <Icon name="swap" size={34} className="text-[var(--ink-strong)]" />
            <div><Avatar who="bob" size={84} /><div className="font-bold">Bob</div></div>
          </div>
          <div className="mt-5"><div className="text-[12px] muted mb-1">a secret key looks like this:</div><span className="keybox">01101</span></div>
          <p className="mt-4 text-[13px] max-w-sm mx-auto">A key is just a list of 0s and 1s. If only Alice and Bob know it, they can use it to lock and unlock messages.</p>
        </div>
      )
    case 1:
      return (
        <div className="text-center">
          <div className="flex items-end justify-center gap-2 mt-2">
            <Avatar who="alice" size={62} /><Arrow />
            <div className="pb-3"><span className="keybox text-[15px] tracking-[3px]">01101</span></div><Arrow />
            <Avatar who="bob" size={62} />
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Avatar who="eve" size={62} />
            <div className="bubble eve text-left max-w-[210px]"><div className="bubble-name">Eve</div>Copy made: <span className="keybox text-[13px] tracking-[2px] px-1.5 py-0">01101</span></div>
          </div>
          <p className="mt-4 text-[13px] max-w-md mx-auto">On today's internet a copy is perfect, so Alice and Bob <b>can't tell</b> a spy was there. And one day, big quantum computers may break today's locks (like RSA).</p>
        </div>
      )
    case 2:
      return (
        <div className="text-center">
          <div className="flex justify-center gap-5 mt-4">
            {[['+', 0], ['+', 1], ['x', 0], ['x', 1]].map(([f, b]) => (
              <div key={f + b} className="panel px-4 py-3"><Photon filter={f} bit={b} size={54} color="#16133A" width={5} /></div>
            ))}
          </div>
          <p className="mt-5 text-[13px] max-w-sm mx-auto">Up-and-down, side-to-side, or slanted one of two ways: <b>which way it points</b> tells you the number.</p>
        </div>
      )
    case 3:
      return (
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mt-2">
          {['+', 'x'].map((f) => (
            <div key={f} className="panel p-3 text-center">
              <Glasses filter={f} size={64} />
              {[0, 1].map((b) => (
                <div key={b} className="flex items-center justify-center gap-2 mt-2 text-[15px]"><Photon filter={f} bit={b} size={32} width={3.5} /> means <b className="text-[20px]">{b}</b></div>
              ))}
            </div>
          ))}
          <p className="col-span-2 text-center text-[12px] muted m-0">Scientists call the glasses <b>filters</b> (or bases).</p>
        </div>
      )
    case 4:
      return (
        <div className="space-y-3 max-w-md mx-auto mt-1">
          <div className="panel p-3 flex items-center gap-2 flex-wrap">
            <span className="text-[12px] w-full font-bold text-[var(--good)]">Same glasses</span>
            <Photon filter="+" bit={0} size={34} width={3.5} /><Arrow /><Glasses filter="+" size={46} /><Arrow />
            <span className="text-[15px]">Bob reads <b className="text-[20px]">0</b> every time <Icon name="check" size={18} className="text-[var(--good)]" /></span>
          </div>
          <div className="panel p-3 flex items-center gap-2 flex-wrap">
            <span className="text-[12px] w-full font-bold text-[var(--bad)]">Different glasses</span>
            <Photon filter="+" bit={0} size={34} width={3.5} /><Arrow /><Glasses filter="x" size={46} /><Arrow />
            <span className="text-[15px]">Bob gets <b className="text-[20px]">0 or 1</b>: a coin flip <Icon name="coin" size={18} className="text-[var(--check)]" /></span>
          </div>
        </div>
      )
    case 5:
      return (
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center flex-wrap gap-1 mt-2">
            <div className="text-center"><Avatar who="alice" size={46} /><div><Photon filter="+" bit={0} size={30} width={3.5} /></div><div className="text-[11px]">sends 0</div></div>
            <Arrow />
            <div className="text-center"><Avatar who="eve" size={46} /><div><Glasses filter="x" size={40} label={false} /></div><div className="text-[11px] text-[var(--bad)]">wrong guess!</div></div>
            <Arrow />
            <div className="text-center"><div className="h-[46px] flex items-center justify-center"><Photon filter="x" bit={0} size={34} color="#E0344B" width={3.5} /></div><div className="text-[11px] text-[var(--bad)]">stick is bent</div></div>
            <Arrow />
            <div className="text-center"><Avatar who="bob" size={46} /><div><Glasses filter="+" size={40} label={false} /></div><div className="text-[11px]">reads 0 or 1</div></div>
          </div>
          <div className="panel p-3 mt-4 text-[13px] text-center">
            Eve guesses wrong <b>half</b> the time. Then Bob is wrong <b>half</b> of those times.<br />
            Half of a half = <b>a quarter</b>: about <b>25 out of 100</b> numbers come out wrong. That's how Eve gets caught!
          </div>
        </div>
      )
    default:
      return (
        <div className="text-[12.5px]">
          <h3>Grown-up words</h3>
          <table className="w-full border-collapse mb-3">
            <tbody>
              {[
                ['light stick', 'photon (its polarization)'],
                ['magic glasses', 'filter or basis: + (straight) or × (diagonal)'],
                ['number', 'bit (0 or 1)'],
                ['mistakes', 'error rate (QBER). Above 11%: throw the key away (spy or noise). Below 11%: carry on, then shrink the key (privacy amplification)'],
              ].map(([k, v]) => (
                <tr key={k} className="border-t border-[var(--line)]"><td className="py-1 font-bold text-[var(--ink-strong)] w-[36%]">{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
          <h3>Old lock vs quantum lock</h3>
          <table className="w-full border-collapse">
            <thead><tr className="text-left"><th></th><th className="py-1">Normal internet (RSA)</th><th className="py-1 text-[var(--cyan)]">Quantum (BB84)</th></tr></thead>
            <tbody>
              {[
                ['Safe because…', 'a maths puzzle is hard', 'the laws of physics'],
                ['A spy copies the key', 'nobody notices', 'the photons change, so they notice'],
                ['Quantum computers', "can break it: Shor's algorithm factors the big numbers fast", 'still safe: no maths puzzle to solve'],
              ].map(([k, a, b]) => (
                <tr key={k} className="border-t border-[var(--line)]"><td className="py-1 font-bold text-[var(--ink-strong)]">{k}</td><td>{a}</td><td>{b}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

export function StoryScreen({ page }) {
  return <div className="screen-pad pop" key={page}><Scene page={page} /></div>
}

export function StoryLeft({ page, setPage, onStart }) {
  const p = PAGES[page]
  const last = page === PAGES.length - 1
  return (
    <>
      <div>
        <div className="text-[12px] text-[var(--ink-soft)]">Story · page {page + 1} of {PAGES.length}</div>
        <h1>{p.title}</h1>
      </div>
      <div key={page} className="pop"><Bubble who={p.who}>{p.say}</Bubble></div>
      <div className="flex gap-1.5 mt-1" aria-label="Story pages">
        {PAGES.map((x, i) => (
          <button key={i} aria-label={`Page ${i + 1}: ${x.title}`} onClick={() => setPage(i)}
            className="h-2.5 flex-1 rounded-full border-0 p-0" style={{ background: i === page ? 'var(--ink-strong)' : i < page ? 'var(--photon)' : '#fff', border: '2px solid var(--ink-strong)' }} />
        ))}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
        {last
          ? <button className="pill" onClick={onStart}>Start <span className="hl">Mission 1</span>!</button>
          : <button className="pill" onClick={() => setPage(page + 1)}>Next <span className="hl">page</span> <Icon name="right" size={18} strokeWidth={2.6} /></button>}
        {page > 0 && <button className="btn-ghost-dark" onClick={() => setPage(page - 1)}><Icon name="left" size={18} strokeWidth={2.6} /> Back</button>}
        {!last && <button className="btn-ghost-dark" onClick={onStart}>Skip to the game</button>}
      </div>
    </>
  )
}
