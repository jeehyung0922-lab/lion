import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ShiftType } from '@/types'
import { StepShell, STEP_GRADIENTS } from '../components/StepShell'
import { SHIFT_COLORS } from '../onboardingData'

/**
 * 본인 선택 (임시) — 단체 근무표에서 "누가 나인지" 매핑.
 * /parse-schedule 가 group으로 판별하면 이 단계 노출. 개인표면 스킵.
 * 이름 리스트 + 근무 미리보기(OCR 이름이 애매해도 패턴으로 확인) + '내 이름 없어요' fallback.
 * TODO: /parse-schedule 의 people[] 로 교체, 선택한 id 서버 전송·프로필 저장(재업로드 시 자동 매핑).
 */
interface Person {
  id: string
  name: string
  preview: ShiftType[] // 이번 주 근무 미리보기
}

// 목: 단체 근무표에서 파싱된 사람들 (박일하 = 본인)
const MOCK_PEOPLE: Person[] = [
  { id: 'p1', name: '박일하', preview: ['DAY', 'DAY', 'DAY', 'OFF', 'NIGHT', 'NIGHT', 'NIGHT'] },
  { id: 'p2', name: '김서준', preview: ['NIGHT', 'NIGHT', 'OFF', 'DAY', 'DAY', 'OFF', 'EVENING'] },
  { id: 'p3', name: '이하늘', preview: ['OFF', 'DAY', 'DAY', 'DAY', 'EVENING', 'EVENING', 'OFF'] },
  {
    id: 'p4',
    name: '최민재',
    preview: ['EVENING', 'EVENING', 'NIGHT', 'NIGHT', 'OFF', 'DAY', 'DAY'],
  },
  { id: 'p5', name: '정유나', preview: ['DAY', 'OFF', 'NIGHT', 'NIGHT', 'NIGHT', 'OFF', 'DAY'] },
]

const SHIFT_ABBR: Record<ShiftType, string> = { DAY: 'D', EVENING: 'E', NIGHT: 'N', OFF: '휴' }
const shiftColor = (s: ShiftType) =>
  s === 'OFF' ? 'rgba(255,255,255,0.12)' : (SHIFT_COLORS as Record<string, string>)[s]

interface PersonSelectStepProps {
  onSelected: (personId: string) => void
  /** 개인화 단계에서 입력한 이름 — 일치하는 사람을 자동으로 선택해 검색 수고를 줄임 */
  enteredName?: string
}

export function PersonSelectStep({ onSelected, enteredName = '' }: PersonSelectStepProps) {
  const trimmedName = enteredName.trim()
  const exactMatch = useMemo(
    () => MOCK_PEOPLE.find((p) => p.name === trimmedName) ?? null,
    [trimmedName],
  )

  const [query, setQuery] = useState(trimmedName)
  const [selected, setSelected] = useState<string | null>(exactMatch?.id ?? null)
  const [showFallback, setShowFallback] = useState(false)

  const people = useMemo(() => MOCK_PEOPLE.filter((p) => p.name.includes(query.trim())), [query])

  return (
    <StepShell
      gradient={STEP_GRADIENTS.scheduleUploaded}
      footer={
        <Button
          onClick={() => selected && onSelected(selected)}
          disabled={!selected}
          className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/15 disabled:opacity-40"
        >
          이 사람으로 계속
        </Button>
      }
    >
      <p className="text-center text-base font-medium text-white/90">
        이 근무표에서 본인을 선택해주세요
      </p>
      <p className="mt-1 mb-4 text-center text-xs text-white/55">
        단체 근무표라 본인 행을 골라야 해요. 이름이 애매하면 근무 패턴으로 확인하세요.
      </p>

      {exactMatch && selected === exactMatch.id && (
        <p className="mb-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center text-xs text-white/75">
          입력하신 이름으로 <span className="font-semibold text-white">{exactMatch.name}</span>님을
          자동으로 선택했어요. 아니라면 아래에서 다른 사람을 골라주세요.
        </p>
      )}

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이름 검색"
        className="mb-3 border-white/10 bg-black/20 text-white placeholder:text-[#888888] focus-visible:border-white/25"
      />

      <div className="space-y-2">
        {people.map((p) => {
          const active = selected === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left backdrop-blur-md transition-colors',
                active
                  ? 'border-white/40 bg-white/15'
                  : 'border-white/10 bg-[#111111]/25 hover:bg-[#111111]/40',
              )}
            >
              <span className="w-16 shrink-0 text-sm font-semibold text-white">{p.name}</span>
              {/* 근무 미리보기 */}
              <span className="flex flex-1 flex-wrap gap-1">
                {p.preview.map((s, i) => (
                  <span
                    key={i}
                    className="flex size-5 items-center justify-center rounded text-[10px] font-bold text-white"
                    style={{ background: shiftColor(s) }}
                  >
                    {SHIFT_ABBR[s]}
                  </span>
                ))}
              </span>
              {active && <Check className="size-4 shrink-0 text-white" />}
            </button>
          )
        })}
        {people.length === 0 && (
          <p className="py-6 text-center text-sm text-white/45">검색 결과가 없어요.</p>
        )}
      </div>

      {/* fallback */}
      <button
        type="button"
        onClick={() => setShowFallback((v) => !v)}
        className="mt-4 text-xs text-white/60 underline underline-offset-2 hover:text-white/85"
      >
        내 이름이 없어요 / 잘못 인식됐어요
      </button>
      {showFallback && (
        <p className="mt-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs leading-relaxed text-white/70">
          근무표 이미지에서 본인 행을 직접 선택하거나 이름을 수정할 수 있어요. (추후 지원)
        </p>
      )}
    </StepShell>
  )
}
