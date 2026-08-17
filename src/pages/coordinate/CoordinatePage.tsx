import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Send } from 'lucide-react'

/**
 * 일정 조율 (AI 대화, 임시) — 홈의 "일정 조율하기 +" 진입.
 * 조율할 내용을 대화로 나누면 AI가 일정을 재생성. 목(mock) 응답.
 * TODO: /parse-disruption + 대화형 재계산 API 연동, 확정 시 RoutineResult 새 version.
 */
interface Msg {
  role: 'ai' | 'user'
  text: string
  proposal?: string[] // AI가 제안한 재생성 일정
}

const GREETING: Msg = {
  role: 'ai',
  text: '무엇을 조율할까요? 바뀐 상황이나 원하는 점을 편하게 말씀해 주세요.',
}

// 목 AI 응답 — 사용자 메시지에 대해 재생성 일정 제안
function mockReply(): Msg {
  return {
    role: 'ai',
    text: '말씀 주신 상황을 반영해 오늘 일정을 다시 짜봤어요. 이 제안으로 적용할까요?',
    proposal: [
      '09:00 → 11:00  주 수면 시작',
      '16:00 → 18:00  기상',
      '17:00 → 19:00  주요 식사',
      '22:00  출근 (유지)',
    ],
  }
}

export default function CoordinatePage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Msg[]>([GREETING])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function send() {
    const text = input.trim()
    if (!text || typing) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setTyping(true)
    // TODO: 실제 AI 재계산 API 호출
    setTimeout(() => {
      setMessages((m) => [...m, mockReply()])
      setTyping(false)
    }, 900)
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[640px] flex-col overflow-hidden bg-[#0d1526]">
      {/* 헤더 */}
      <header className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-3">
        <button
          onClick={() => navigate('/home')}
          aria-label="뒤로"
          className="rounded-md p-1 text-white/80 hover:bg-white/10"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-base font-semibold text-white">일정 조율</h1>
      </header>

      {/* 대화 — min-h-0 없으면 flex 아이템이 내용만큼 늘어나 전체 화면이 스크롤됨 */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} onApply={() => navigate('/home')} />
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm bg-[#111111]/50 px-4 py-2.5 text-sm text-white/60 backdrop-blur-md">
              입력 중…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* 입력 */}
      <div className="flex shrink-0 items-center gap-2 border-t border-white/10 px-3 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="예) 퇴근이 2시간 늦어졌어요"
          className="flex-1 rounded-full border border-white/10 bg-black/25 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus-visible:border-white/25 focus-visible:outline-none"
        />
        <button
          onClick={send}
          disabled={!input.trim() || typing}
          aria-label="보내기"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40"
          style={{ background: '#00F7EF' }}
        >
          <Send className="size-4" style={{ color: '#0d1526' }} />
        </button>
      </div>
    </div>
  )
}

function Bubble({ msg, onApply }: { msg: Msg; onApply: () => void }) {
  const isAi = msg.role === 'ai'
  return (
    <div className={isAi ? 'flex justify-start' : 'flex justify-end'}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm backdrop-blur-md ${
          isAi ? 'rounded-tl-sm bg-[#111111]/45 text-white/90' : 'rounded-tr-sm text-[#0d1526]'
        }`}
        style={isAi ? undefined : { background: '#00F7EF' }}
      >
        <p className="leading-relaxed">{msg.text}</p>
        {msg.proposal && (
          <div className="mt-2 space-y-1 rounded-xl bg-black/25 p-3">
            {msg.proposal.map((p, i) => (
              <p key={i} className="text-xs tabular-nums text-white/85">
                {p}
              </p>
            ))}
            <button
              onClick={onApply}
              className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 py-2 text-xs font-semibold text-white hover:bg-white/15"
            >
              이 일정으로 적용
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
