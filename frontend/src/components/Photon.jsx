import { useId } from 'react'

export const sym = (f) => (f === 'x' ? '×' : '+')

/** A photon drawn as a short line: + filter → | (0) or — (1); × filter → / (0) or \ (1). */
export function Photon({ filter, bit, size = 20, color = '#16133A', width = 2.4, title }) {
  if (filter == null || bit == null) return null
  const angle = filter === '+' ? (bit ? 0 : 90) : bit ? 135 : 45
  const rad = (angle * Math.PI) / 180
  const c = size / 2
  const r = size * 0.38
  const dx = r * Math.cos(rad)
  const dy = r * Math.sin(rad)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" className="inline-block align-middle"
      aria-label={title || `bit ${bit} on the ${sym(filter)} filter`}>
      <line x1={c - dx} y1={c + dy} x2={c + dx} y2={c - dy} stroke={color} strokeWidth={width} strokeLinecap="round" />
    </svg>
  )
}

/** The glowing yellow "photon source" graphic used in the dark hero panel. */
export function GlowPhoton({ size = 76 }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true" className="shrink-0">
      <defs>
        <radialGradient id={`g${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF3C4" />
          <stop offset="35%" stopColor="#FFC83D" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFC83D" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill={`url(#g${id})`} opacity="0.55" />
      <circle cx="40" cy="40" r="22" fill="none" stroke="#16133A" strokeOpacity="0.35" strokeWidth="1" />
      <circle cx="40" cy="40" r="30" fill="none" stroke="#16133A" strokeOpacity="0.15" strokeWidth="1" />
      <circle cx="40" cy="40" r="11" fill="#FFF8E1" stroke="#16133A" strokeWidth="2.5" />
      <line x1="31" y1="49" x2="49" y2="31" stroke="#16133A" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}
