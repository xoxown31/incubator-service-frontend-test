import { useState, useEffect, useRef, useCallback } from 'react'
import { getGames, submitRecord, getLeaderboard, getTodayScore, getMyRecords } from '../api/minigame'
import Layout from '../components/Layout'

const TEXTS = [
  "문제를 오래 붙잡고 있으면 오히려 해결이 멀어질 수 있다. 잠깐 내려놓고 다른 일을 하다 보면 뜻밖의 답이 떠오른다.",
  "인큐베이션은 의식적으로 문제를 잊는 행위다. 뇌는 그 사이에도 백그라운드에서 계속 문제를 처리하고 있다.",
  "창의적인 해결책은 강요로 나오지 않는다. 긴장을 풀고 무관한 활동을 할 때 갑자기 떠오르는 경우가 많다.",
  "타자 연습은 손가락의 기억을 훈련한다. 눈으로 보지 않고도 자판을 칠 수 있을 때 진정한 실력이 생긴다.",
  "문제 해결의 핵심은 집착이 아니라 리듬이다. 집중과 휴식을 반복하는 사람이 결국 더 나은 답을 찾는다.",
]

const DURATION = 30
const DIFFICULTY_LABEL = { EASY: '쉬움', NORMAL: '보통', HARD: '어려움' }
const DIFFICULTY_COLOR = { EASY: 'text-green-600 bg-green-50', NORMAL: 'text-yellow-600 bg-yellow-50', HARD: 'text-red-600 bg-red-50' }

export default function MinigamePage() {
  const [games, setGames] = useState([])
  const [myRecords, setMyRecords] = useState([])
  const [showMyRecords, setShowMyRecords] = useState(false)
  const [selectedGame, setSelectedGame] = useState(null)
  const [phase, setPhase] = useState('select') // select | ready | playing | result
  const [text, setText] = useState('')
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [startTime, setStartTime] = useState(null)
  const [result, setResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [todayScore, setTodayScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    getGames().then(r => {
      const list = r.data.data || []
      setGames(list)
    }).catch(() => {})
    getTodayScore().then(r => setTodayScore(r.data.data || 0)).catch(() => {})
    getMyRecords().then(r => setMyRecords(r.data.data || [])).catch(() => {})
  }, [])

  const selectGame = (game) => {
    setSelectedGame(game)
    setPhase('ready')
    setResult(null)
    setLeaderboard([])
    getLeaderboard(game.id, 10).then(r => setLeaderboard(r.data.data || [])).catch(() => {})
  }

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
        if (t <= 1) { clearInterval(timerRef.current); setPhase('result'); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  const handleInput = (e) => {
    const val = e.target.value
    setInput(val)
    if (val === text) {
      clearInterval(timerRef.current)
      setPhase('result')
    }
  }

  useEffect(() => {
    if (phase !== 'result' || !startTime || submitting || !selectedGame) return

    const elapsed = Math.max(1, Math.round((Date.now() - startTime) / 1000))
    let correct = 0
    for (let i = 0; i < input.length; i++) {
      if (input[i] === text[i]) correct++
    }
    const accuracy = input.length > 0 ? correct / input.length : 0
    const wpm = Math.max(1, Math.round((correct / 5) / (elapsed / 60)))
    // score = WPM * 정확도 보정 (0~100 스케일)
    const score = Math.round(wpm * accuracy)

    setResult({ score, wpm, accuracy, durationSeconds: elapsed })

    const doSubmit = async () => {
      setSubmitting(true)
      try {
        await submitRecord(selectedGame.id, score, elapsed)
        const [lb, ts] = await Promise.all([
          getLeaderboard(selectedGame.id, 10),
          getTodayScore(),
        ])
        setLeaderboard(lb.data.data || [])
        setTodayScore(ts.data.data || 0)
      } catch { /* ignore */ } finally {
        setSubmitting(false)
      }
    }
    doSubmit()
  }, [phase])

  const renderText = () =>
    text.split('').map((char, i) => {
      let color = 'text-gray-400'
      if (i < input.length) color = input[i] === char ? 'text-indigo-600' : 'text-red-500'
      else if (i === input.length) color = 'text-gray-900 underline'
      return <span key={i} className={color}>{char}</span>
    })

  const timerColor = timeLeft <= 10 ? 'text-red-500' : 'text-indigo-600'

  return (
    <Layout>
      <div className="space-y-6">

        {/* 오늘의 점수 */}
        <div className="bg-indigo-50 rounded-2xl px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-700">오늘의 점수</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-indigo-600">{todayScore}</span>
            <button
              onClick={() => setShowMyRecords(v => !v)}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              {showMyRecords ? '내 기록 닫기' : '내 기록 보기'}
            </button>
          </div>
        </div>

        {/* 내 기록 */}
        {showMyRecords && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">내 전체 기록</h3>
            {myRecords.length === 0
              ? <p className="text-sm text-gray-400 text-center py-4">기록이 없습니다.</p>
              : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {myRecords.map(r => (
                    <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">{r.gameName}</span>
                        <span className="text-xs text-gray-400 ml-2">{r.durationSeconds}초</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-indigo-600">{r.score}점</span>
                        <span className="text-xs text-gray-300 ml-2">
                          {new Date(r.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* 게임 선택 */}
        {phase === 'select' && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">게임 선택</h2>
            {games.length === 0
              ? <p className="text-sm text-gray-400 text-center py-8">등록된 게임이 없습니다.</p>
              : (
                <div className="space-y-3">
                  {games.map(g => (
                    <button
                      key={g.id}
                      onClick={() => selectGame(g)}
                      className="w-full bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{g.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLOR[g.difficulty]}`}>
                          {DIFFICULTY_LABEL[g.difficulty]}
                        </span>
                      </div>
                      {g.description && <p className="text-sm text-gray-500">{g.description}</p>}
                      {g.avgDuration && <p className="text-xs text-gray-400 mt-1">평균 {g.avgDuration}초</p>}
                    </button>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* 게임 영역 */}
        {phase !== 'select' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-semibold text-gray-900">{selectedGame?.name}</span>
                {selectedGame?.difficulty && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLOR[selectedGame.difficulty]}`}>
                    {DIFFICULTY_LABEL[selectedGame.difficulty]}
                  </span>
                )}
              </div>
              <button
                onClick={() => { clearInterval(timerRef.current); setPhase('select') }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ← 목록
              </button>
            </div>

            {phase === 'ready' && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-xs mb-6">{DURATION}초 동안 제시된 문장을 최대한 빠르고 정확하게 입력하세요</p>
                <button onClick={start} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-medium">
                  시작하기
                </button>
              </div>
            )}

            {phase === 'playing' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
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
                  autoComplete="off" autoCorrect="off" spellCheck={false}
                />
              </div>
            )}

            {phase === 'result' && result && (
              <div className="text-center py-4 space-y-6">
                <h3 className="font-bold text-gray-900 text-lg">결과</h3>
                <div className="flex justify-center gap-8">
                  <div>
                    <p className="text-3xl font-bold text-indigo-600">{result.score}</p>
                    <p className="text-xs text-gray-400 mt-1">점수</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-700">{result.wpm}</p>
                    <p className="text-xs text-gray-400 mt-1">WPM</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-600">{Math.round(result.accuracy * 100)}%</p>
                    <p className="text-xs text-gray-400 mt-1">정확도</p>
                  </div>
                </div>
                {submitting && <p className="text-xs text-gray-400">기록 저장 중...</p>}
                <button onClick={start} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-medium">
                  다시하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 리더보드 */}
        {selectedGame && leaderboard.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">🏆 {selectedGame.name} 리더보드 (TOP 10)</h3>
            <div className="space-y-2">
              {leaderboard.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-5 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-300'}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700">User #{r.userId}</span>
                  </div>
                  <span className="font-bold text-indigo-600 text-sm">{r.score}점</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
