/**
 * One icon set for the whole app, replacing emoji.
 * Every icon sits on a 24×24 grid, drawn with a 2px round stroke in currentColor,
 * so it takes the colour and size of the text around it.
 */
const P = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h5v-6h3v6h5V10" /></>,
  book: <><path d="M2.5 5H9a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5h-7z" /><path d="M21.5 5H15a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5h7z" /></>,
  flask: <><path d="M9 3h6" /><path d="M10 3v6l-5.4 9.4A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.4-2.6L14 9V3" /><path d="M7.4 15h9.2" /></>,
  photon: <><circle cx="12" cy="12" r="9" /><path d="m8.5 15.5 7-7" /></>,
  spy: <><path d="M3.5 10.5h17" /><path d="M7 10.5 8.6 5h6.8l1.6 5.5" /><circle cx="8" cy="16" r="3" /><circle cx="16" cy="16" r="3" /><path d="M11 16h2" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5.5a2.5 2.5 0 0 0 2.6 4" /><path d="M16 6h2.5a2.5 2.5 0 0 1-2.6 4" /><path d="M12 13v4" /><path d="M8.5 20.5h7" /><path d="M9.5 17h5v3.5h-5z" /></>,
  game: <><rect x="2.5" y="7" width="19" height="11" rx="5" /><path d="M7.5 10.5v4M5.5 12.5h4" /><path d="M15 11.5h.01M17.5 13.5h.01" /></>,
  star: <path d="m12 3.2 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  right: <path d="m9.5 6 6 6-6 6" />,
  left: <path d="m14.5 6-6 6 6 6" />,
  refresh: <><path d="M20 12a8 8 0 1 1-2.4-5.7" /><path d="M20 4.5V9h-4.5" /></>,
  table: <><rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="M3 10h18M9 4.5v15" /></>,
  alert: <><path d="M12 3.5 21.5 20h-19z" /><path d="M12 10v4.5M12 17.2v.1" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m20 20-5-5" /></>,
  eyeoff: <><path d="m3 3 18 18" /><path d="M10.6 6.1A9 9 0 0 1 12 6c5 0 9 6 9 6a15 15 0 0 1-2.9 3.4" /><path d="M6.6 6.7C4.2 8.2 3 12 3 12s4 6 9 6a8.5 8.5 0 0 0 4.3-1.2" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  shades: <><path d="M2 9h20" /><path d="M3.5 9 4.6 14a3 3 0 0 0 2.9 2.3h.4A3 3 0 0 0 11 13.3V9" /><path d="M20.5 9 19.4 14a3 3 0 0 1-2.9 2.3h-.4A3 3 0 0 1 13 13.3V9" /></>,
  wave: <path d="M2 12q2.5-5.5 5 0t5 0 5 0 5 0" />,
  swap: <><path d="M4 8.5h15l-3.5-3.5" /><path d="M20 15.5H5L8.5 19" /></>,
  coin: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5.5" /></>,
  tree: <><path d="M12 3 17.5 10.5h-3L19 17H5l4.5-6.5h-3z" /><path d="M12 17v4" /></>,
  sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6.3 6.3 2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" /></>,
  key: <><circle cx="8" cy="15.5" r="4.5" /><path d="m11.2 12.3 8.8-8.8M16.5 7l2.5 2.5M14 9.5l2 2" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
}

export const ICON_NAMES = Object.keys(P)

export function Icon({ name, size = 20, fill = false, strokeWidth = 2, title, className = '', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={`icon shrink-0 ${className}`} style={style}
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
      {P[name]}
    </svg>
  )
}
