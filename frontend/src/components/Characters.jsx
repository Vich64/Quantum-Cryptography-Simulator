import { useId } from 'react'
import { Icon } from './Icons.jsx'
import { sym } from './Photon.jsx'

export const NAMES = { alice: 'Alice', bob: 'Bob', eve: 'Eve the spy' }

const INK = '#16133A'
const line = { stroke: INK, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' }

/** Eyes with a tiny shine, so faces look alive even at 40px. */
function Eyes({ y = 31, dx = 4.6, r = 1.9 }) {
  return (
    <g>
      {[-dx, dx].map((d) => (
        <g key={d}>
          <circle cx={32 + d} cy={y} r={r} fill={INK} />
          <circle cx={32 + d + 0.6} cy={y - 0.7} r={0.6} fill="#fff" />
        </g>
      ))}
    </g>
  )
}
const Cheeks = ({ y = 35 }) => (
  <g fill="#FF8A7A" opacity=".55"><circle cx="24.6" cy={y} r="2.1" /><circle cx="39.4" cy={y} r="2.1" /></g>
)

/** Alice sends the photons: blue jacket (+ glasses colour) and a photon-yellow hair clip. */
function Alice() {
  const skin = '#F6C8A0', hair = '#5A321F'
  return (
    <>
      <path d="M16.5 35 Q13.5 17 32 14.5 Q50.5 17 47.5 35 L48.5 47 Q32 53 15.5 47 Z" fill={hair} {...line} />
      <path d="M6 66 Q7 49 32 48 Q57 49 58 66 Z" fill="#2F6BFF" {...line} />
      <path d="M25 48.3 L32 56 L39 48.3" fill="#fff" {...line} />
      <path d="M28.5 40 v9 h7 v-9" fill={skin} {...line} />
      <ellipse cx="32" cy="30.5" rx="11.5" ry="12.5" fill={skin} {...line} />
      <path d="M20.3 30 Q19 16.5 32 16.5 Q45 16.5 43.7 30 Q41 23.5 35 23 Q34 25.5 29.5 26 Q31 23.5 30 22.5 Q24 24 20.3 30 Z" fill={hair} {...line} />
      <g transform="rotate(-28 40.5 19.5)"><rect x="36.5" y="17.5" width="8" height="4" rx="2" fill="#FFC83D" stroke={INK} strokeWidth="1.6" /></g>
      <Eyes /><Cheeks />
      <path d="M28.6 36.3 Q32 39.4 35.4 36.3" fill="none" {...line} strokeWidth="1.8" />
    </>
  )
}

/** Bob receives the photons: coral hoodie (× glasses colour), curly hair, big grin. */
function Bob() {
  const skin = '#C98B5E', hair = '#2A1C14'
  return (
    <>
      <path d="M6 66 Q7 49 32 48 Q57 49 58 66 Z" fill="#FF6A3D" {...line} />
      <path d="M19 51 Q21 43.5 32 43.5 Q43 43.5 45 51 Q39 47.5 32 47.5 Q25 47.5 19 51 Z" fill="#E2552C" {...line} />
      <path d="M29 49 v6.5 M35 49 v6.5" fill="none" {...line} strokeWidth="1.6" />
      <circle cx="29" cy="56.5" r="1.2" fill="#fff" stroke={INK} strokeWidth="1.2" /><circle cx="35" cy="56.5" r="1.2" fill="#fff" stroke={INK} strokeWidth="1.2" />
      <path d="M28.5 40 v8 h7 v-8" fill={skin} {...line} />
      <circle cx="20.3" cy="31.5" r="2.6" fill={skin} {...line} /><circle cx="43.7" cy="31.5" r="2.6" fill={skin} {...line} />
      <ellipse cx="32" cy="30.5" rx="11.5" ry="12.3" fill={skin} {...line} />
      <path d="M19.6 28.5 Q17 21.5 22 19.5 Q22.5 13.5 28.5 14.2 Q32 10.2 36 13.4 Q42 12.4 42.8 18.4 Q47.2 21 44.4 28.5 Q42 23.5 37.5 24 Q35 21.5 32 23.2 Q28.5 21.2 26 23.6 Q21.5 23 19.6 28.5 Z" fill={hair} {...line} />
      <path d="M25.6 27.6 l3.2 -.8 M38.4 27.6 l-3.2 -.8" fill="none" {...line} strokeWidth="1.6" />
      <Eyes y={31.2} /><Cheeks y={35.3} />
      <path d="M27.6 35.6 Q32 41.2 36.4 35.6 Z" fill="#fff" {...line} strokeWidth="1.8" />
    </>
  )
}

/** Eve the spy: violet hood, dark sunglasses, a sly little smirk. */
function Eve() {
  const skin = '#F0C2A0'
  return (
    <>
      <path d="M6 66 Q7 49 32 48 Q57 49 58 66 Z" fill="#6A1FC2" {...line} />
      <path d="M11.5 52 Q9.5 17 32 11.5 Q54.5 17 52.5 52 Q43 47 32 47 Q21 47 11.5 52 Z" fill="#8B3DDB" {...line} />
      <ellipse cx="32" cy="32.5" rx="14" ry="15" fill="#3A0E70" />
      <ellipse cx="32" cy="32.5" rx="10.8" ry="11.8" fill={skin} {...line} />
      <path d="M21.3 30 Q22.5 20.5 32 20.5 Q41.5 20.5 42.7 30 Q38 25.5 33 26.5 Q28 24 21.3 30 Z" fill="#2E0A5C" {...line} />
      <path d="M22 30.5 h8.6 v2.6 q0 3.4 -4.3 3.4 q-4.3 0 -4.3 -3.4 Z M33.4 30.5 h8.6 v2.6 q0 3.4 -4.3 3.4 q-4.3 0 -4.3 -3.4 Z" fill={INK} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M30.6 31.3 h2.8" stroke={INK} strokeWidth="1.8" />
      <path d="M24 32 l2.2 -1.1 M35.4 32 l2.2 -1.1" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".85" />
      <path d="M28.8 39.6 Q32.5 41.4 36.2 38.2" fill="none" {...line} strokeWidth="1.8" />
    </>
  )
}

const LOOK = {
  alice: { bg: '#E4ECFF', Face: Alice },
  bob: { bg: '#FFE7DE', Face: Bob },
  eve: { bg: '#2A2152', Face: Eve },
}

/** The three characters, drawn in the app's ink-outline style. */
export function Avatar({ who, size = 56 }) {
  const id = useId().replace(/:/g, '')
  const { bg, Face } = LOOK[who]
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={NAMES[who]} className="shrink-0">
      <defs><clipPath id={`c${id}`}><circle cx="32" cy="32" r="30" /></clipPath></defs>
      <circle cx="32" cy="32" r="30.5" fill={bg} />
      <g clipPath={`url(#c${id})`}><Face /></g>
      <circle cx="32" cy="32" r="30.5" fill="none" stroke={INK} strokeWidth="2.5" />
    </svg>
  )
}

/** A character saying something in a speech bubble. */
export function Bubble({ who, children, size = 48 }) {
  return (
    <div className="flex gap-3 items-start">
      <Avatar who={who} size={size} />
      <div className={`bubble ${who}`}>
        <div className="bubble-name">{NAMES[who]}</div>
        {children}
      </div>
    </div>
  )
}

export const GLASS_COLOR = { '+': '#2F6BFF', x: '#FF6A3D' }

/** Magic glasses: "+" glasses (blue) and "×" glasses (orange). Scientists call them filters or bases. */
export function Glasses({ filter, size = 44, label = true }) {
  const col = GLASS_COLOR[filter]
  return (
    <span className="inline-flex flex-col items-center leading-none align-middle">
      <svg width={size} height={size * 0.5} viewBox="0 0 48 24" role="img" aria-label={`${sym(filter)} glasses`}>
        <path d="M21 11 Q24 7 27 11" stroke={col} strokeWidth="2.5" fill="none" />
        <path d="M3 10 L0 7 M45 10 L48 7" stroke={col} strokeWidth="2.5" />
        {[12, 36].map((x) => (
          <g key={x}>
            <circle cx={x} cy="12" r="9.5" fill="#fff" stroke={col} strokeWidth="2.5" />
            <text x={x} y="16.5" textAnchor="middle" fontSize="13" fontWeight="700" fill={col}>{sym(filter)}</text>
          </g>
        ))}
      </svg>
      {label && size >= 40 && <span className="text-[10px] font-bold mt-0.5" style={{ color: col }}>{sym(filter)} glasses</span>}
    </span>
  )
}

/** Compact glasses marker for tables: a big coloured + or ×. */
export function GlassTag({ filter }) {
  if (!filter) return null
  return <span className={`gtag ${filter === 'x' ? 'x' : 'p'}`} aria-label={`${sym(filter)} glasses`}>{sym(filter)}</span>
}

/** A photon nobody has looked at yet: a glowing ball with a question mark. */
export function Mystery({ size = 34, label = '?' }) {
  return <span className="mystery" style={{ width: size, height: size, fontSize: size * 0.45 }} aria-label="photon not read yet">{label}</span>
}

export function Stars({ n = 0, max = 3, size = 16 }) {
  return (
    <span className="stars" role="img" aria-label={`${n} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => <Icon key={i} name="star" fill size={size} className={i < n ? 'on' : ''} />)}
    </span>
  )
}

export function Celebrate({ stars, title, children }) {
  return (
    <div className="text-center py-4 pop">
      <div className="text-[15px] muted font-semibold">Mission complete!</div>
      <div className="text-[30px] font-extrabold tracking-tight leading-none text-[var(--ink-strong)] mt-1 mb-3">{title}</div>
      <Stars n={stars} size={38} />
      <div className="text-[16px] mt-3 max-w-md mx-auto">{children}</div>
    </div>
  )
}
