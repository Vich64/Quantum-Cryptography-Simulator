import { Icon } from './Icons.jsx'
import { Bubble, Celebrate } from './Characters.jsx'

export const QUESTIONS = [
  {
    q: 'Why does Eve make mistakes appear?',
    options: ['When she guesses the wrong glasses, she bends the light stick', 'Photons get tired when someone looks at them', 'She copies the photons perfectly', "Bob's computer sees her name"],
    answer: 0,
    why: 'Eve has to guess the glasses. A wrong guess bends the stick, so Bob sometimes reads the wrong number.',
  },
  {
    q: 'What do Alice and Bob say out loud after the photons arrive?',
    options: ['All their numbers', 'Only which glasses they used', 'The whole secret key', 'Nothing at all'],
    answer: 1,
    why: "Saying the glasses is safe: knowing someone wore + glasses doesn't tell you if the number was 0 or 1.",
  },
  {
    q: 'About how many photons do Alice and Bob keep?',
    options: ['A quarter', 'About half', 'Three quarters', 'All of them'],
    answer: 1,
    why: "Bob picks the same glasses as Alice about half the time, so about half the photons are kept.",
  },
  {
    q: 'If Eve peeks at every photon, about how many kept numbers come out wrong?',
    options: ['None', '1 in 10', '1 in 4 (25%)', '1 in 2 (50%)'],
    answer: 2,
    why: 'Eve guesses wrong half the time, and then Bob is wrong half of those times. Half of a half is a quarter: 25%.',
  },
  {
    q: "Why can't Eve just make a copy of a photon and look at the copy?",
    options: ['Photons are too fast to catch', 'Nature does not allow copying an unknown photon (the No-Cloning rule)', 'Copies always say 0', "It's against school rules"],
    answer: 1,
    why: 'Scientists proved in 1982 that an unknown photon cannot be copied. So Eve must look at the real one, and that leaves mistakes.',
  },
]

export const quizStars = (score) => (score === 5 ? 3 : score >= 3 ? 2 : 1)

export function QuizScreen({ quiz, setQuiz }) {
  const { index, answers } = quiz
  if (index >= QUESTIONS.length) {
    const score = QUESTIONS.filter((q, i) => answers[i] === q.answer).length
    return (
      <div className="screen-pad">
        <Celebrate stars={quizStars(score)} title={`Boss Quiz: ${score} / ${QUESTIONS.length}`}>
          {score === 5 ? 'Perfect! You really know how BB84 works.' : 'Nice try! Check the answers below, then play again for 3 stars.'}
        </Celebrate>
        <ol className="pl-5 text-[14px] space-y-1">
          {QUESTIONS.map((q, i) => (
            <li key={i}>
              {q.q}{' '}
              <span className={answers[i] === q.answer ? 'text-[var(--good)] font-bold' : 'text-[var(--bad)]'}>
                {answers[i] === q.answer ? <Icon name="check" size={18} title="Right" /> : <><Icon name="x" size={18} title="Wrong" /> Answer: {q.options[q.answer]}</>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    )
  }
  const q = QUESTIONS[index]
  const picked = answers[index]
  return (
    <div className="screen-pad" key={index}>
      <div className="muted text-[13px]">Question {index + 1} of {QUESTIONS.length}</div>
      <h3 className="text-[19px] pop">{q.q}</h3>
      <div className="space-y-2 mt-3">
        {q.options.map((o, i) => {
          const state = picked == null ? '' : i === q.answer ? 'right' : i === picked ? 'wrong shake' : 'opacity-50'
          return (
            <button key={i} disabled={picked != null} onClick={() => setQuiz({ ...quiz, answers: { ...answers, [index]: i } })}
              className={`big-choice block w-full text-left text-[16px] font-semibold ${state}`}>
              <b className="text-[var(--primary)] mr-2">{'ABCD'[i]}</b>{o}
            </button>
          )
        })}
      </div>
      {picked != null && (
        <div className={`note mt-4 pop ${picked === q.answer ? 'good' : 'bad'}`}>
          <b>{picked === q.answer ? 'Correct!' : 'Not quite.'}</b> {q.why}
        </div>
      )}
    </div>
  )
}

export function QuizLeft({ quiz, setQuiz, onFinish, onLab }) {
  const { index, answers } = quiz
  const done = index >= QUESTIONS.length
  const score = QUESTIONS.filter((q, i) => answers[i] === q.answer).length
  const next = () => {
    if (index === QUESTIONS.length - 1) onFinish(score)
    setQuiz({ ...quiz, index: index + 1 })
  }
  return (
    <>
      <div>
        <div className="text-[13px] text-[var(--ink-soft)]">Boss Quiz · score {score} / {QUESTIONS.length}</div>
        <h2>Beat the <span className="hl">Boss Quiz</span></h2>
      </div>
      <Bubble who="bob">Five questions about everything you learned. Pick an answer and I'll tell you if you're right, and why. Get all 5 for <b>3 stars</b>!</Bubble>
      <div className="flex gap-1.5" aria-label="Progress">
        {QUESTIONS.map((q, i) => (
          <span key={i} className="h-3 flex-1 rounded-full" style={{ background: answers[i] == null ? '#fff' : answers[i] === q.answer ? 'var(--good)' : 'var(--bad)', border: '2px solid var(--ink-strong)' }} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {done ? (
          <>
            <button className="pill" onClick={onLab}>Go to the <span className="hl">Lab</span> <Icon name="right" size={18} strokeWidth={2.6} /></button>
            <button className="btn-ghost-dark" onClick={() => setQuiz({ index: 0, answers: {} })}>Play again</button>
          </>
        ) : (
          <button className="pill" disabled={answers[index] == null} onClick={next}>
            {index === QUESTIONS.length - 1 ? <>See my <span className="hl">stars</span></> : <>Next <span className="hl">question</span> <Icon name="right" size={18} strokeWidth={2.6} /></>}
          </button>
        )}
      </div>
    </>
  )
}
