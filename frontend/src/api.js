// Set VITE_API_URL when the backend lives on another host (e.g. Render). Empty = same origin / Vite proxy.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function request(path, options) {
  let res
  try {
    res = await fetch(BASE + path, options)
  } catch {
    throw new Error('Cannot reach the simulator backend. Is it running on port 8000?')
  }
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`
    try {
      const j = await res.json()
      msg = typeof j.detail === 'string' ? j.detail : j.detail?.map((d) => d.msg).join('; ') || msg
    } catch { /* keep status text */ }
    throw new Error(msg)
  }
  return res.json()
}

export const runBB84 = (body) =>
  request('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const runSweep = (n = 800, noisePercent = 0) => request(`/api/sweep?n_photons=${n}&noise_percent=${noisePercent}`)
export const getCircuit = (params) => request('/api/circuit?' + new URLSearchParams(params))
export const getHealth = () => request('/api/health')
export const measureOnce = (bit, aliceFilter, bobFilter) =>
  request('/api/measure?' + new URLSearchParams({ bit, alice_filter: aliceFilter, bob_filter: bobFilter }))
