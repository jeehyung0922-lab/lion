import { useEffect, useMemo, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { ScheduleDay, ShiftType } from '@/types'
import { StepShell, STEP_GRADIENTS } from '../components/StepShell'
import { MonthCalendar } from '../components/MonthCalendar'
import {
  MOCK_SCHEDULE,
  MOCK_SHIFT_TYPES,
  SHIFT_COLORS,
  type ShiftTypeInfo,
} from '../onboardingData'

const SHIFT_ORDER: ShiftType[] = ['DAY', 'EVENING', 'NIGHT', 'OFF']
const SHIFT_LABEL: Record<ShiftType, string> = {
  DAY: 'DAY (주간)',
  EVENING: 'EVENING (이브닝)',
  NIGHT: 'NIGHT (야간)',
  OFF: '휴무',
}

/** 3. AI 분석 결과 확인·보정 */
export function AiResultStep({ onConfirm }: { onConfirm: () => void }) {
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeInfo[]>(MOCK_SHIFT_TYPES)
  const [schedule, setSchedule] = useState<ScheduleDay[]>(MOCK_SCHEDULE)
  const [editType, setEditType] = useState<ShiftTypeInfo | null>(null)
  const [editDay, setEditDay] = useState<ScheduleDay | null>(null)

  // 근무표가 걸친 달 목록 (YYYY-MM). 화살표로 이동.
  const months = useMemo(
    () => [...new Set(schedule.map((d) => d.date.slice(0, 7)))].sort(),
    [schedule],
  )
  const [viewIdx, setViewIdx] = useState(0)
  const [viewYear, viewMonth] = months[Math.min(viewIdx, months.length - 1)].split('-').map(Number)

  function saveType(next: ShiftTypeInfo) {
    setShiftTypes((prev) => prev.map((t) => (t.shift === next.shift ? next : t)))
    setEditType(null)
  }

  function setDayShift(date: string, shift: ShiftType) {
    const meta = shiftTypes.find((t) => t.shift === shift)
    setSchedule((prev) =>
      prev.map((d) =>
        d.date === date ? { ...d, shift, startTime: meta?.startTime, endTime: meta?.endTime } : d,
      ),
    )
    setEditDay(null)
  }

  return (
    <StepShell
      gradient={STEP_GRADIENTS.aiResult}
      footer={
        <Button
          onClick={onConfirm}
          className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/15"
        >
          이 근무표로 나만의 리듬 생성하기
        </Button>
      }
    >
      <p className="mb-5 text-center text-sm leading-relaxed text-white/85">
        AI가 근무표를 분석한 결과입니다.
        <br />
        수정이 필요한 부분을 클릭해 수정해주세요.
      </p>

      {/* 교대유형 카드 (DAY=초록 #ABFF24, NIGHT=파랑 #1000F7) */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {shiftTypes.map((t) => {
          const isDay = t.shift === 'DAY'
          const accent = isDay ? SHIFT_COLORS.DAY : SHIFT_COLORS.NIGHT
          // 불투명 배경 — 뒤 그라데이션 글로우의 영향을 받지 않도록
          const bg = isDay ? '#3a6018' : '#23345c'
          const color = accent
          return (
            <button
              key={t.shift}
              type="button"
              onClick={() => setEditType(t)}
              className="flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors"
              style={{ borderColor: `${accent}66`, backgroundColor: bg }}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {t.shift === 'DAY' ? (
                  <Sun className="size-4" style={{ color }} />
                ) : (
                  <Moon className="size-4" style={{ color }} />
                )}
                {t.shift === 'DAY' ? 'DAY(주간)' : 'NIGHT(야간)'}
              </span>
              <span className="text-xs tabular-nums text-white/70">
                {t.startTime} - {t.endTime}
              </span>
            </button>
          )
        })}
      </div>

      {/* 월간 달력 (근무표가 걸친 달을 화살표로 이동) */}
      <MonthCalendar
        year={viewYear}
        month={viewMonth}
        schedule={schedule}
        onSelectDay={setEditDay}
        onPrev={() => setViewIdx((i) => Math.max(0, i - 1))}
        onNext={() => setViewIdx((i) => Math.min(months.length - 1, i + 1))}
        canPrev={viewIdx > 0}
        canNext={viewIdx < months.length - 1}
      />

      {/* 교대유형 시각 수정 드로어 */}
      <ShiftTypeEditor value={editType} onSave={saveType} onClose={() => setEditType(null)} />

      {/* 날짜별 교대유형 수정 시트 */}
      <Sheet open={editDay !== null} onOpenChange={(o) => !o && setEditDay(null)}>
        <SheetContent side="bottom" className="mx-auto max-w-[480px] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editDay?.date} 교대유형</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-6 py-2">
            {SHIFT_ORDER.map((s) => (
              <Button
                key={s}
                variant="secondary"
                onClick={() => editDay && setDayShift(editDay.date, s)}
                className={
                  editDay?.shift === s
                    ? 'border border-white/30 bg-white/15 text-white hover:bg-white/20'
                    : ''
                }
              >
                {SHIFT_LABEL[s]}
              </Button>
            ))}
          </div>
          <SheetFooter>
            <Button variant="ghost" onClick={() => setEditDay(null)}>
              닫기
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </StepShell>
  )
}

/** 교대유형 시작/종료 시각 수정 */
function ShiftTypeEditor({
  value,
  onSave,
  onClose,
}: {
  value: ShiftTypeInfo | null
  onSave: (v: ShiftTypeInfo) => void
  onClose: () => void
}) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  // value(열린 교대유형)가 바뀔 때 입력 초기값 동기화
  useEffect(() => {
    if (value) {
      setStart(value.startTime)
      setEnd(value.endTime)
    }
  }, [value])

  function close() {
    onClose()
  }

  return (
    <Sheet open={value !== null} onOpenChange={(o) => !o && close()}>
      <SheetContent side="bottom" className="mx-auto max-w-[480px] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{value?.shift === 'DAY' ? 'DAY(주간)' : 'NIGHT(야간)'} 시각</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 px-6 py-2">
          <div className="space-y-1.5">
            <Label>시작</Label>
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>종료</Label>
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <SheetFooter>
          <Button
            onClick={() => {
              if (value) onSave({ ...value, startTime: start, endTime: end })
            }}
            className="border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15"
          >
            확인
          </Button>
          <Button variant="ghost" onClick={close}>
            취소
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
