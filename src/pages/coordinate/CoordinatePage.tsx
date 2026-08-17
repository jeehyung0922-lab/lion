import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Send } from 'lucide-react'
import { api, ApiError, type PreviewResult } from '@/lib/api'

/**
 * 일정 조율 (AI 대화) — 홈의 "일정 조율하기 +" 진입.
 * 사용자가 바뀐 상황을 자유텍스트로 보내면 POST /api/routines/replan/preview(rawText)로
 * AI가 파싱해 재계산한 전/후(before/after)를 받아 보여주고, "이대로 확정"을 누르면
 * POST /api/routines/replan/confirm(previewId)로 실제 반영한다.
 * previewId는 서버 인메모리 캐시에 5분(TTL)만 유지되므로, 너무 늦게 확정하면 410(만료)이 뜬다.
 */
interface Msg {
  role: 'ai' | 'user'
  text: string
  preview?: PreviewResult
  confirmState?: 'idle' | 'confirming' | 'confirmed' | 'error'
  confirmError?: string
}

const GREETING: Msg = {
  role: 'ai',
  text: '무엇을 조율할까요? 바뀐 상황이나 원하는 점을 편하게 말씀해 주세요.',
}

/** 백엔드가 파싱 실패 시 주는 구체적 사유(예: PARSE_FAILED "근무 관련 내용으로 다시 입력해주세요")를 그대로 보여준다 */
function describePreviewError(e: unknown): string {
  if (e instanceof ApiError) {
    try {
      const parsed = JSON.parse(e.message)
      if (typeof parsed?.message === 'string') return parsed.message
    } catch {
      /* JSON 아님 — 아래 기본 메시지로 폴백 */
    }
  }
  return '일정을 다시 계산하지 못했어요. 다른 표현으로 다시 말씀해주세요.'
}

const SNAPSHOT_ROWS: { key: keyof PreviewResult['before']; label: string }[] = [
  { key: 'mode', label: '모드' },
  { key: 'sleepStart', label: '취침' },
  { key: 'sleepEnd', label: '기상' },
  { key: 'mainMeal', label: '주요 식사' },
  { key: 'subMeal', label: '부 식사' },
]

export default function CoordinatePage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Msg[]>([GREETING])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  async function send() {
    const text = input.trim()
    if (!text || typing) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setTyping(true)
    try {
      const preview = await api.previewReplan({ rawText: text })
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          text: preview.aiReason || '말씀 주신 상황을 반영해 일정을 다시 짜봤어요.',
          preview,
          confirmState: 'idle',
        },
      ])
    } catch (e) {
      setMessages((m) => [...m, { role: 'ai', text: describePreviewError(e) }])
    } finally {
      setTyping(false)
    }
  }

  async function applyPreview(index: number) {
    const msg = messages[index]
    if (!msg.preview) return
    setMessages((m) =>
      m.map((it, i) => (i === index ? { ...it, confirmState: 'confirming' } : it)),
    )
    try {
      await api.confirmReplan(msg.preview.previewId)
      setMessages((m) =>
        m.map((it, i) => (i === index ? { ...it, confirmState: 'confirmed' } : it)),
      )
      navigate('/home')
    } catch (e) {
      const expired = e instanceof ApiError && e.status === 410
      setMessages((m) =>
        m.map((it, i) =>
          i === index
            ? {
                ...it,
                confirmState: 'error',
                confirmError: expired
                  ? '제안이 만료됐어요(5분). 다시 말씀해주시면 새로 계산할게요.'
                  : '확정하지 못했어요. 다시 시도해주세요.',
              }
            : it,
        ),
      )
    }
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[640px] flex-col bg-[#0d1526]">
      {/* 헤더 */}
      <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <button
          onClick={() => navigate('/home')}
          aria-label="뒤로"
          className="rounded-md p-1 text-white/80 hover:bg-white/10"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-base font-semibold text-white">일정 조율</h1>
      </header>

      {/* 대화 */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} onApply={() => applyPreview(i)} />
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm bg-[#111111]/50 px-4 py-2.5 text-sm text-white/60 backdrop-blur-md">
              다시 계산하는 중…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* 입력 */}
      <div className="flex items-center gap-2 border-t border-white/10 px-3 py-3">
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
  const { preview, confirmState } = msg
  return (
    <div className={isAi ? 'flex justify-start' : 'flex justify-end'}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm backdrop-blur-md ${
          isAi ? 'rounded-tl-sm bg-[#111111]/45 text-white/90' : 'rounded-tr-sm text-[#0d1526]'
        }`}
        style={isAi ? undefined : { background: '#00F7EF' }}
      >
        <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
        {preview && confirmState !== 'confirmed' && (
          <div className="mt-2 space-y-1 rounded-xl bg-black/25 p-3">
            {SNAPSHOT_ROWS.map((row) => {
              const before = preview.before[row.key]
              const after = preview.after[row.key]
              const changed = before !== after
              return (
                <p key={row.key} className="flex items-center gap-1.5 text-xs text-white/85">
                  <span className="w-16 shrink-0 text-white/50">{row.label}</span>
                  <span className="tabular-nums">{before}</span>
                  {changed && (
                    <>
                      <span className="text-white/40">→</span>
                      <span className="font-semibold tabular-nums" style={{ color: '#00F7EF' }}>
                        {after}
                      </span>
                    </>
                  )}
                </p>
              )
            })}
            <button
              onClick={onApply}
              disabled={confirmState === 'confirming'}
              className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 py-2 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-50"
            >
              {confirmState === 'confirming' ? '확정하는 중…' : '이대로 확정'}
            </button>
            {confirmState === 'error' && msg.confirmError && (
              <p className="text-[11px] text-[#ff8fb0]">{msg.confirmError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
