import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitRecord, getLeaderboard } from '../api/minigame'

const TEXTS = [
  "문제를 오래 붙잡고 있으면 오히려 해결이 멀어질 수 있다. 잠깐 내려놓고 다른 일을 하다 보면 뜻밖의 답이 떠오른다.",
  "인큐베이션은 의식적으로 문제를 잊는 행위다. 뇌는 그 사이에도 백그라운드에서 계속 문제를 처리하고 있다.",
  "창의적인 해결책은 강요로 나오지 않는다. 긴장을 풀고 무관한 활동을 할 때 갑자기 떠오르는 경우가 많다.",
  "타자 연습은 손가락의 기억을 훈련한다. 눈으로 보지 않고도 자판을 칠 수 있을 때 진정한 실력이 생긴다.",
  "문제 해결의 핵심은 집착이 아니라 리듬이다. 집중과 휴식을 반복하는 사람이 결국 더 나은 답을 찾는다.",
]

const DURATION = 30 // seconds

export default function MinigamePage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('ready') // ready | playing | result
  const [text, setText] = useState('')
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [startTime, setStartTime] = useState(null)
  const [result, setResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  const loadLeaderboard = useCallback(async () => {
    try {
      const { data } = await getLeaderboard('TYPING_PRACTICE', 10)
      setLeaderboard(data.data || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadLeaderboard() }, [loadLeaderboard])

  const start = () => {
    const picked = TEXTS[Math.floor(Math.random() * TEXTS.length)]
    setText(picked)
    setInput('')
    setTimeLeft(DURATION)
    setPhase('playing')
    setStartTime(Date.now())
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); finish(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  const finish = useCallback(() => {
    clearInterval(timerRef.current)
    setPhase('result')
  }, [])

  // 타이핑 완료 시 즉시 종료
  const handleInput = (e) => {
    const val = e.target.value
    setInput(val)
    if (val === text) {
      clearInterval(timerRef.current)
      setPhase('result')
    }
  }

  // result phase에서 계산 후 제출
  useEffect(() => {
    if (phase !== 'result' || !startTime || submitting) return

    const elapsed = Math.max(1, Math.round((Date.now() - startTime) / 1000))
    const typedChars = input.length
    let correct = 0
    for (let i = 0; i < typedChars; i++) {
      if (input[i] === text[i]) correct++
    }
    const accuracy = typedChars > 0 ? correct / typedChars : 0
    const wpm = Math.max(1, Math.round((correct / 5) / (elapsed / 60)))

    setResult({ wpm, accuracy, durationSeconds: elapsed, correct, total: typedChars })

    const submit = async () => {
      setSubmitting(true)
      try {
        await submitRecord(wpm, parseFloat(accuracy.toFixed(4)), elapsed, 'TYPING_PRACTICE')
        await loadLeaderboard()
      } catch { /* ignore */ } finally {
        setSubmitting(false)
      }
    }
    submit()
  }, [phase])

  // 글자별 색상
  const renderText = () => {
    return text.split('').map((char, i) => {
      let color = 'text-gray-400'
      if (i < input.length) {
        color = input[i] === char ? 'text-indigo-600' : 'text-red-500'
      } else if (i === input.length) {
        color = 'text-gray-900 underline'
      }
      return <span key={i} className={color}>{char}</span>
    })
  }

  const timerColor = timeLeft <= 10 ? 'text-red-500' : 'text-indigo-600'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-indigo-600 font-bold text-xl">Incubator</button>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-medium text-gray-700">타자 게임</span>
        </div>
        <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-gray-700">내 문제</button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* 게임 영역 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          {phase === 'ready' && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-2">인큐베이션 중 인지 부하를 분산시키는 타자 게임</p>
              <p className="text-gray-400 text-xs mb-6">{DURATION}초 동안 제시된 문장을 최대한 빠르고 정확하게 입력하세요</p>
              <button onClick={start} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-medium transition-colors">
                시작하기
              </button>
            </div>
          )}

          {phase === 'playing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">타이핑</span>
                <span className={`text-2xl font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-lg leading-relaxed font-medium tracking-wide">
                {renderText()}
              </div>
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={3}
                placeholder="여기에 입력하세요..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          )}

          {phase === 'result' && result && (
            <div className="text-center py-4 space-y-6">
              <h3 className="font-bold text-gray-900 text-lg">결과</h3>
              <div className="flex justify-center gap-8">
                <div>
                  <p className="text-3xl font-bold text-indigo-600">{result.wpm}</p>
                  <p className="text-xs text-gray-400 mt-1">WPM</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">{Math.round(result.accuracy * 100)}%</p>
                  <p className="text-xs text-gray-400 mt-1">정확도</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-700">{result.durationSeconds}s</p>
                  <p className="text-xs text-gray-400 mt-1">소요 시간</p>
                </div>
              </div>
              {submitting && <p className="text-xs text-gray-400">기록 저장 중...</p>}
              <button onClick={start} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-medium transition-colors">
                다시하기
              </button>
            </div>
          )}
        </div>

        {/* 리더보드 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">🏆 리더보드 (TOP 10)</h3>
          {leaderboard.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">아직 기록이 없습니다.</p>
            : (
              <div className="space-y-2">
                {leaderboard.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-5 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-300'}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700">User #{r.userId}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="font-bold text-indigo-600">{r.wpm} WPM</span>
                      <span className="text-gray-400">{Math.round(r.accuracy * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </main>
    </div>
  )
}
