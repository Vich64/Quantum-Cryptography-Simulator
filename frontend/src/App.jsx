import { useEffect, useState } from 'react'
import { getHealth, runBB84, runSweep } from './api.js'
import { AREA, Footer, Inspector, Stage, StatusTablet, TopBar } from './components/Chrome.jsx'
import { cleverEvePercent, EveLeft, EveScreen } from './components/Eve.jsx'
import { Home, LabTabs, LearnPath, learnStops, nextStop } from './components/Home.jsx'
import { MISSIONS, Missions } from './components/Missions.jsx'
import { QuizLeft, QuizScreen, quizStars } from './components/Quiz.jsx'
import { SimLeft, SimScreen } from './components/Simulator.jsx'
import { STORY_PAGES, StoryLeft, StoryScreen } from './components/Story.jsx'

const SAVE_KEY = 'qcs-stars-v1'
const STORY_KEY = 'qcs-story-done-v1'
function loadStars() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {} } catch { return {} }
}
function loadStoryDone() {
  try { return localStorage.getItem(STORY_KEY) === '1' } catch { return false }
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [lastTab, setLastTab] = useState({ learn: null, lab: 'simulator' }) // where Learn / Lab in the top bar take you back to
  const [storyDone, setStoryDone] = useState(loadStoryDone)
  const [settings, setSettings] = useState({ nPhotons: 16, eveOn: false, evePercent: 100, noisePercent: 0, checkPercent: 25, seed: '' })
  const [run, setRun] = useState(null)
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null) // photon followed in the inspector; null = inspector closed
  const [eveStep, setEveStep] = useState(1)
  const [sweep, setSweep] = useState(null)
  const [sweepBusy, setSweepBusy] = useState(false)
  const [storyPage, setStoryPage] = useState(0)
  const [mission, setMission] = useState(0)
  const [stars, setStars] = useState(loadStars)
  const [quiz, setQuiz] = useState({ index: 0, answers: {} })
  const [health, setHealth] = useState(null)
  const [healthError, setHealthError] = useState(null)

  useEffect(() => {
    getHealth().then(setHealth).catch((e) => setHealthError(e.message))
  }, [])
  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(stars)) } catch { /* storage may be blocked */ }
  }, [stars])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [tab])
  useEffect(() => {
    if (AREA[tab] !== 'home') setLastTab((l) => ({ ...l, [AREA[tab]]: tab }))
  }, [tab])
  // Reading to the last story page counts as finishing the story.
  useEffect(() => {
    if (tab === 'story' && storyPage === STORY_PAGES - 1 && !storyDone) setStoryDone(true)
  }, [tab, storyPage, storyDone])
  useEffect(() => {
    try { localStorage.setItem(STORY_KEY, storyDone ? '1' : '0') } catch { /* storage may be blocked */ }
  }, [storyDone])

  const setStar = (id, n) => setStars((s) => ({ ...s, [id]: Math.max(s[id] || 0, n) }))
  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0)
  const unlocked = (i) => i === 0 || (stars[MISSIONS[i - 1].id] || 0) > 0
  const stops = learnStops({ stars, storyDone, unlocked })
  const currentStop = tab === 'story' ? 0 : tab === 'missions' ? 1 + mission : tab === 'quiz' ? stops.length - 1 : -1

  function goStop(s) {
    if (s.id === 'story') setTab('story')
    else if (s.id === 'quiz') setTab('quiz')
    else { setMission(s.mission); setTab('missions') }
  }
  function goArea(a) {
    if (a === 'home') setTab('home')
    else if (a === 'learn') { if (lastTab.learn) setTab(lastTab.learn); else goStop(nextStop(stops)) }
    else setTab(lastTab.lab)
  }
  // "Try it in the Lab" from Mission 2 (Photon Lab) and Mission 3 (Spy Lab with a clever Eve ready).
  function tryInLab(which) {
    if (which === 'eve') {
      setSettings((s) => ({ ...s, eveOn: true, evePercent: cleverEvePercent(s.noisePercent), nPhotons: Math.max(s.nPhotons, 128) }))
      setEveStep(1)
    } else {
      setStep(0)
    }
    setTab(which)
  }

  async function doRun({ preset = null, jumpTo = 1 } = {}) {
    setBusy(true)
    setError(null)
    try {
      const body = { n_photons: Number(settings.nPhotons), eve_on: settings.eveOn, eve_percent: Number(settings.evePercent), check_percent: Number(settings.checkPercent), noise_percent: Number(settings.noisePercent), preset }
      if (settings.seed !== '') body.seed = Number(settings.seed)
      setRun(await runBB84(body))
      setStep(jumpTo)
      setSelected(null)
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function doSweep() {
    setSweepBusy(true)
    setError(null)
    try {
      setSweep(await runSweep(800, Number(settings.noisePercent)))
    } catch (e) {
      setError(e.message)
    } finally {
      setSweepBusy(false)
    }
  }

  const views = {
    story: {
      left: <StoryLeft page={storyPage} setPage={setStoryPage} onStart={() => { setMission(0); setTab('missions') }} />,
      screen: <StoryScreen page={storyPage} />,
    },
    simulator: {
      left: <SimLeft settings={settings} setSettings={setSettings} run={run} step={run ? step : 0} setStep={setStep} busy={busy} error={error} onRun={doRun}
        onOpenSpyLab={() => { setEveStep(1); setTab('eve') }} />,
      screen: <SimScreen run={run} step={run ? step : 0} selected={selected} onSelect={setSelected} />,
    },
    eve: {
      left: <EveLeft step={eveStep} setStep={setEveStep} settings={settings} setSettings={setSettings} busy={busy} error={error} onRun={doRun} run={run}
        onOpenTable={() => { setStep(5); setTab('simulator') }} />,
      screen: <EveScreen step={eveStep} setStep={setEveStep} settings={settings} run={run} sweep={sweep} sweepBusy={sweepBusy} onSweep={doSweep}
        selected={selected} onSelect={setSelected} />,
    },
    quiz: {
      left: <QuizLeft quiz={quiz} setQuiz={setQuiz} onFinish={(score) => setStar('quiz', quizStars(score))} onLab={() => setTab('simulator')} />,
      screen: <QuizScreen quiz={quiz} setQuiz={setQuiz} />,
    },
  }
  const v = views[tab]
  const labTab = tab === 'simulator' || tab === 'eve'
  const revealed = { kept: tab !== 'simulator' || step >= 3, errors: tab !== 'simulator' || step >= 4 }
  // The inspector stays closed until a photon is tapped (photon table, or the Spy Lab's spy map).
  const showInspector = run && selected != null && (tab === 'simulator' || (tab === 'eve' && eveStep === 3))

  return (
    <>
      <TopBar area={AREA[tab]} onArea={goArea} totalStars={totalStars} />
      <main className="wrap space-y-5 pt-5">
        {tab === 'home' && <Home stops={stops} totalStars={totalStars} onGo={goStop} onLab={setTab} />}
        {AREA[tab] === 'learn' && <LearnPath stops={stops} current={currentStop} onGo={goStop} />}
        {labTab && <LabTabs tab={tab} setTab={setTab} />}
        {/* Missions stay mounted so switching tabs doesn't lose a game in progress */}
        <div hidden={tab !== 'missions'}>
          <Missions mission={mission} setMission={setMission} stars={stars} setStar={setStar}
            totalStars={totalStars} onQuiz={() => setTab('quiz')} onLab={tryInLab} />
        </div>
        {v && <Stage left={v.left} screen={v.screen} tablet={labTab ? <StatusTablet run={run} revealed={revealed} health={health} /> : null} />}
        {showInspector && (
          <Inspector run={run} index={selected} step={tab === 'eve' ? 5 : step} onClose={() => setSelected(null)}
            hint={tab === 'eve' ? 'Tap another square in the spy map to follow a different photon.' : 'Tap any column in the photon table to follow another photon.'} />
        )}
      </main>
      <Footer health={health} healthError={healthError} />
    </>
  )
}
