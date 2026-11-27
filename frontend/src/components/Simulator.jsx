import { Icon } from './Icons.jsx'
import { Bubble, Glasses, GlassTag } from './Characters.jsx'
import { Photon, sym } from './Photon.jsx'

const BAD = '#E0344B'
export const pct = (v, d = 0) => (v == null ? '–' : `${(v * 100).toFixed(d)}%`)

export const STATUS = {
  accepted: { label: 'Few mistakes: OK to go on', cls: 'good' },
  rejected: { label: 'Too many mistakes! Key thrown away', cls: 'bad' },
  too_short: { label: 'Too few numbers to check', cls: 'idle' },
}

export const STEPS = [
  { title: 'Get ready', who: 'alice', body: <>Pick how many photons I should send, then press <b>Start</b>. New here? Try the <b>easy 8-photon example</b> first.</> },
  { title: 'Step 1 · Alice sends', who: 'alice', body: <>For every photon I pick a random <b>number</b> (0 or 1) and random <b>glasses</b> (+ or ×). Then I send a light stick pointing the matching way.</> },
  { title: 'Step 2 · Bob reads', who: 'bob', body: <>I don't know Alice's glasses, so I pick my own at random. <b>Same glasses</b> as Alice: I read the right number. <b>Different glasses</b>: I just guess, like flipping a coin.</> },
  { title: 'Step 3 · Compare glasses', who: 'alice', body: <>Bob and I say out loud which <b>glasses</b> we used, but never the numbers. We keep only the photons where our glasses <b>match</b> (the blue ones). That's about half.</> },
  { title: 'Step 4 · Check for a spy', who: 'bob', body: <>We read a few kept numbers out loud (orange) to compare them. More than <b>1 in 10</b> wrong? A spy (or a very noisy line) was there, so we throw the key away. Fewer? We carry on, but a <b>careful</b> spy may still have peeked at a few numbers.</> },
  { title: 'Step 5 · Secret key ready', who: 'alice', body: <>The kept numbers we did <b>not</b> say out loud become our secret key. Bob has his own copy.</> },
]

export function ErrorMeter({ value, label }) {
  const v = value ?? 0
  const bad = v > 0.11
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="muted">{label}</span>
        <b style={{ color: bad ? 'var(--bad)' : 'var(--good)' }}>{pct(value, 1)}</b>
      </div>
      <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={50} aria-valuenow={Math.round(v * 100)} aria-label={label}>
        <i style={{ width: `${Math.min(v / 0.5, 1) * 100}%`, background: bad ? 'var(--bad)' : 'var(--good)' }} />
        <span className="limit" style={{ left: `${(0.11 / 0.5) * 100}%` }} title="11% safety limit" />
      </div>
      <div className="flex justify-between text-[10px] muted mt-0.5"><span>0%</span><span style={{ marginLeft: "12%" }}>spy line (11%)</span><span>50%</span></div>
    </div>
  )
}

export function KeyBits({ bits, other }) {
  return (
    <span className="bits break-all">
      {bits.map((b, i) => (
        <span key={i} className={other && other[i] !== b ? 'bit-bad' : ''}>{b}{i % 8 === 7 ? ' ' : ''}</span>
      ))}
    </span>
  )
}

function PhotonTable({ run, step, selected, onSelect }) {
  const eve = run.eve_fraction > 0
  const big = run.n_photons <= 16
  const rows = [
    { key: 'n', label: 'Photon', show: 1, cell: (p) => p.index },
    { key: 'ab', label: "Alice's number", show: 1, cell: (p) => p.alice_bit },
    { key: 'af', label: "Alice's glasses", show: 1, cell: (p) => <GlassTag filter={p.alice_filter} /> },
    { key: 'ap', label: 'Stick sent', show: 1, cell: (p) => <Photon filter={p.alice_filter} bit={p.alice_bit} size={big ? 26 : 18} width={big ? 3 : 2.4} /> },
    ...(eve
      ? [
          { key: 'ef', label: "Eve's glasses", show: 2, cell: (p) => (p.eve_read ? <GlassTag filter={p.eve_filter} /> : '') },
          {
            key: 'ep', label: 'After Eve', show: 2,
            cell: (p) => (p.eve_read ? <Photon filter={p.eve_filter} bit={p.eve_bit} size={big ? 26 : 18} width={big ? 3 : 2.4} color={p.eve_changed ? BAD : '#16133A'}
              title={p.eve_changed ? 'changed by Eve' : 'Eve guessed the right filter'} /> : ''),
          },
        ]
      : []),
    { key: 'bf', label: "Bob's glasses", show: 2, cell: (p) => <GlassTag filter={p.bob_filter} /> },
    { key: 'bb', label: "Bob's number", show: 2, cell: (p) => p.bob_bit, err: (p) => step >= 4 && p.error },
    { key: 'sf', label: 'Same glasses?', show: 3, cell: (p) => <Icon name={p.same_filter ? 'check' : 'x'} size={16} title={p.same_filter ? 'same' : 'different'} /> },
    { key: 'ck', label: 'Said out loud', show: 4, cell: (p) => (p.is_check ? <Icon name={p.error ? 'x' : 'check'} size={16} title={p.error ? 'different' : 'match'} /> : ''), err: (p) => p.is_check && p.error },
    { key: 'kb', label: 'Secret key', show: 5, cell: (p) => (p.in_key ? p.alice_bit : '') },
  ].filter((r) => step >= r.show)

  const colCls = (p, i) => {
    const c = []
    if (step >= 3) c.push(!p.same_filter ? 'faded' : step >= 4 && p.is_check ? 'check' : 'kept')
    if (i === selected) c.push('sel')
    return c.join(' ')
  }

  return (
    <table className={`ptable ${big ? "big" : ""}`}>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} className={r.show === step ? 'fresh' : ''}>
            <th scope="row">{r.label}</th>
            {run.photons.map((p, i) => (
              <td key={i} className={`${colCls(p, i)} ${r.err?.(p) ? 'err' : ''}`} onClick={() => onSelect(i)}
                title={`Photon ${p.index}: click to inspect its circuit`}>
                {r.cell(p)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function SimScreen({ run, step, selected, onSelect }) {
  if (!run || step === 0) {
    return (
      <div className="screen-pad">
        <h3>The photon table</h3>
        <p className="muted">Press <b>Start sending</b>. Each photon gets its own column, and a new row appears every time you press <b>Next step</b>.</p>
        <div className="grid grid-cols-2 gap-3 mt-4 max-w-sm">
          {['+', 'x'].map((f) => (
            <div key={f} className="panel p-3 text-center">
              <Glasses filter={f} size={52} />
              {[0, 1].map((b) => (
                <div key={b} className="flex items-center justify-center gap-2 mt-1"><Photon filter={f} bit={b} size={24} width={3} /> means <b>{b}</b></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }
  const st = STATUS[run.status]
  return (
    <div>
      <div className="overflow-x-auto px-2 pt-2">
        <PhotonTable run={run} step={step} selected={selected} onSelect={onSelect} />
      </div>
      {selected == null && <p className="text-[13px] muted px-5 mt-2 mb-0">Tap any column to follow that photon.</p>}
      <div className="screen-pad space-y-3">
        {step >= 3 && (
          <div className="text-[14px]">
            Matching glasses on <b>{run.kept_count}</b> of {run.n_photons} photons (<b>{pct(run.keep_rate)}</b>, about half). Their numbers:{' '}
            <KeyBits bits={run.sifted_key} />
          </div>
        )}
        {step >= 4 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <ErrorMeter value={run.estimated_qber} label={`Mistakes in the ${run.check_count} numbers said out loud`} />
            <div className="text-[14px] self-center">
              <b>{run.check_errors}</b> of {run.check_count} didn't match.<br />
              <span className={`badge ${st.cls}`}>{st.label}</span>
            </div>
          </div>
        )}
        {step >= 5 && (
          <div className="text-[14px] space-y-1">
            <div><span className="inline-block w-28 muted">Alice's key</span><KeyBits bits={run.alice_key} /></div>
            <div><span className="inline-block w-28 muted">Bob's key</span><KeyBits bits={run.bob_key} other={run.alice_key} /></div>
            <div className="muted">
              {run.alice_key.length} numbers long.{' '}
              {run.keys_match ? 'Both keys are exactly the same!' : 'Red numbers are different: Eve messed up the key.'}
              {run.status === 'accepted' && !run.keys_match && ' Some mistakes slipped past the check (they weren\'t said out loud).'}
            </div>
            {run.status === 'accepted' && run.eve_count > 0 && (
              <div className="note warn text-[13px]">
                Few mistakes, so Alice and Bob carry on. But Eve's copy matches <b>{run.eve_known_key_bits} of the {run.alice_key.length}</b> key numbers!
                Low mistakes means "OK to continue", not "no spy". See the Spy Lab for her spy map.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function SimLeft({ settings, setSettings, run, step, setStep, busy, error, onRun, onOpenSpyLab }) {
  const s = STEPS[step]
  const eveNote = step === 2 && run?.eve_fraction > 0
  const set = (k) => (e) => setSettings({ ...settings, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  return (
    <>
      <div>
        <div className="text-[13px] text-[var(--ink-soft)]">Photon Lab · {s.title}{run && step > 0 ? ` · ${run.n_photons} photons` : ''}</div>
        <h2>Make a <span className="hl">secret key</span></h2>
      </div>
      <div className="flex flex-wrap items-center gap-2" aria-label="Spy settings shared with the Spy Lab">
        {settings.eveOn
          ? <span className="setchip eve"><Icon name="spy" size={16} /> Eve peeks at {settings.evePercent}%</span>
          : <span className="setchip off"><Icon name="spy" size={16} /> Eve is off</span>}
        <span className="setchip noise"><Icon name="wave" size={16} /> Noise {settings.noisePercent}%</span>
        <button className="linkbtn text-[14px]" onClick={onOpenSpyLab}>Change in Spy Lab</button>
      </div>
      <div key={step} className="pop"><Bubble who={s.who}>{s.body}</Bubble></div>
      {eveNote && <Bubble who="eve">I peeked at {run.eve_count} photons with guessed glasses. The <b>red</b> sticks are the ones I bent!</Bubble>}
      {step === 5 && run?.status === 'rejected' && <div className="note bad">Too many mistakes this time: a spy or a noisy line, they can't tell which. So Alice and Bob throw this key away and start again.</div>}
      <div className="flex flex-wrap items-center gap-3">
        {!run || step === 0 ? (
          <button className="pill" disabled={busy} onClick={() => onRun({ jumpTo: 1 })}>{busy ? 'Sending…' : <>Start <span className="hl">sending</span></>}</button>
        ) : step < 5 ? (
          <button className="pill" onClick={() => setStep(step + 1)}>Next step <Icon name="right" size={18} strokeWidth={2.6} /></button>
        ) : (
          <button className="pill" disabled={busy} onClick={() => onRun({ jumpTo: 1 })}>{busy ? 'Sending…' : <>Send <span className="hl">again</span></>}</button>
        )}
        {run && step > 1 && <button className="btn-ghost-dark" onClick={() => setStep(step - 1)}><Icon name="left" size={18} strokeWidth={2.6} /> Back</button>}
        {run && step > 0 && step < 5 && <button className="btn-ghost-dark" onClick={() => setStep(5)}>Skip to the key</button>}
      </div>
      <button className="btn-ghost-dark self-start" disabled={busy} onClick={() => onRun({ preset: 'slide12', jumpTo: 1 })}
        title="The 8-photon example from the proposal (slide 12)"><Icon name="star" size={17} /> Easy 8-photon example</button>
      <div className="rule" />
      <label>
        Photons Alice sends: <b className="text-[var(--ink-strong)]">{settings.nPhotons}</b>
        <input type="range" min={8} max={256} step={8} value={settings.nPhotons} onChange={set('nPhotons')} className="w-full accent-[var(--ink-strong)]" />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={settings.eveOn} onChange={set('eveOn')} className="accent-[var(--eve)] w-4 h-4" />
        Let Eve the spy listen
      </label>
      <details className="text-[14px]">
        <summary className="cursor-pointer muted font-semibold">Grown-up settings</summary>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <label>
            Numbers to check
            <select className="field w-full" value={settings.checkPercent} onChange={set('checkPercent')}>
              <option value={10}>10% of kept</option>
              <option value={25}>25% of kept</option>
              <option value={50}>50% of kept</option>
            </select>
          </label>
          <label>
            Seed (repeatable run)
            <input className="field w-full" inputMode="numeric" placeholder="random" value={settings.seed}
              onChange={(e) => setSettings({ ...settings, seed: e.target.value.replace(/\D/g, '').slice(0, 9) })} />
          </label>
        </div>
      </details>
      {error && <div className="note bad" role="alert">{error}</div>}
    </>
  )
}
