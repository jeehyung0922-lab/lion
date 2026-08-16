import { useState } from 'react'
import { Loader2, ArrowRight } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { RoutineRow } from './RoutineList'

/**
 * 재설계 (S2-b, 임시) — "계획이 바뀌었나요?"
 * 자유텍스트 입력 → /parse-disruption(목) → 규칙+AI 재계산 → 전후 비교 → 확정/되돌리기.
 * TODO: 실제 /parse-disruption 연동, 확정 시 RoutineResult 새 version 생성.
 */
const EXAMPLES = ['퇴근이 2시간 늦어졌어요', '갑자기 회식이 잡혔어요', '낮에 못 자고 깼어요']

// 밀리는 항목(수면/기상/식사)을 +2시간 이동시키는 목 재계산
const SHIFTED = new Set(['주 수면 시작', '기상', '주요 식사'])
function shift(hhmm: string, min: number) {
  const total = (Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3)) + min + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
function recalc(before: RoutineRow[]): RoutineRow[] {
  return before.map((r) => (SHIFTED.has(r.label) ? { ...r, time: shift(r.time, 120) } : r))
}

interface ReplanSheetProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  routine: RoutineRow[]
  onConfirm: (next: RoutineRow[]) => void
}

export function ReplanSheet({ open, onOpenChange, routine, onConfirm }: ReplanSheetProps) {
  const [phase, setPhase] = useState<'input' | 'loading' | 'result'>('input')
  const [text, setText] = useState('')
  const [after, setAfter] = useState<RoutineRow[] | null>(null)

  function reset() {
    setPhase('input')
    setText('')
    setAfter(null)
  }
  function close() {
    onOpenChange(false)
    setTimeout(reset, 250)
  }
  function submit() {
    if (!text.trim()) return
    setPhase('loading')
    // TODO: POST /parse-disruption { text } → 규칙+AI 재계산 결과
    setTimeout(() => {
      setAfter(recalc(routine))
      setPhase('result')
    }, 900)
  }
  function confirm() {
    if (after) onConfirm(after)
    close()
  }

  const changes = after
    ? routine.map((b, i) => ({ b, a: after[i] })).filter((x) => x.b.time !== x.a.time)
    : []

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <SheetContent side="bottom" className="mx-auto max-w-[480px] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>계획 다시 조정하기</SheetTitle>
        </SheetHeader>

        {/* 1) 자유텍스트 입력 */}
        {phase === 'input' && (
          <div className="space-y-3 px-6 pb-4">
            <p className="text-sm text-white/70">무엇이 바뀌었는지 편하게 적어주세요.</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="예) 퇴근이 2시간 늦어졌어요"
              className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-[#888888] focus-visible:border-white/25 focus-visible:outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setText(ex)}
                  className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/70 hover:bg-white/10"
                >
                  {ex}
                </button>
              ))}
            </div>
            <Button
              onClick={submit}
              disabled={!text.trim()}
              className="h-11 w-full rounded-xl border border-white/20 bg-white/10 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/15 disabled:opacity-40"
            >
              지금 상황으로 다시 조정하기
            </Button>
          </div>
        )}

        {/* 2) 재계산 로딩 */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-white/70">
            <Loader2 className="size-6 animate-spin" style={{ color: '#00F7EF' }} />
            <p className="text-sm">지금 상황을 기준으로 다시 계산하고 있어요…</p>
          </div>
        )}

        {/* 3) 전후 비교 + 확정/되돌리기 */}
        {phase === 'result' && (
          <div className="space-y-4 px-6 pb-4">
            <p className="rounded-xl border border-[#00F7EF]/30 bg-[#00F7EF]/10 px-3 py-2.5 text-xs leading-relaxed text-white/90">
              말씀 주신 상황을 반영해 수면·식사를 2시간 뒤로 옮겼어요. 출근 시각은 그대로예요.
            </p>

            <div className="space-y-1.5">
              <p className="text-xs text-[#888888]">바뀌는 항목</p>
              {changes.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
                >
                  <span className="flex-1 text-white/90">{c.b.label}</span>
                  <span className="tabular-nums text-white/45 line-through">{c.b.time}</span>
                  <ArrowRight className="size-3.5 text-white/40" />
                  <span className="tabular-nums font-semibold text-white">{c.a.time}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="ghost"
                onClick={close}
                className="flex-1 text-white/75 hover:bg-white/10 hover:text-white"
              >
                되돌리기
              </Button>
              <Button
                onClick={confirm}
                className="flex-1 border border-white/20 bg-white/10 font-semibold text-white backdrop-blur-sm hover:bg-white/15"
              >
                이대로 확정
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
