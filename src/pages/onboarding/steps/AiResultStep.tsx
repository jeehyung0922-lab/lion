import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { ScheduleDay, ShiftType } from '@/types'
import { StepShell, STEP_GRADIENTS } from '../components/StepShell'
import { MonthCalendar } from '../components/MonthCalendar'
import { MOCK_SCHEDULE, MOCK_SHIFT_TYPES, type ShiftTypeInfo } from '../onboardingData'

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
        <Button onClick={onConfirm} className="h-12 w-full rounded-2xl text-base font-semibold">
          이 근무표로 나만의 리듬 생성하기
        </Button>
      }
    >
      <p className="mb-5 text-center text-sm leading-relaxed text-white/85">
        AI가 근무표를 분석한 결과입니다.
        <br />
        수정이 필요한 부분을 클릭해 수정해주세요.
      </p>

      {/* 교대유형 카드 */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {shiftTypes.map((t) => (
          <button
            key={t.shift}
            type="button"
            onClick={() => setEditType(t)}
            className={cn(
              'flex flex-col gap-2 rounded-2xl border p-4 text-left backdrop-blur-sm transition-colors',
              t.shift === 'DAY'
                ? 'border-[color:var(--color-mode-day)]/40 bg-[color:var(--color-mode-day)]/10'
                : 'border-[color:var(--color-mode-night)]/40 bg-[color:var(--color-mode-night)]/10',
            )}
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              {t.shift === 'DAY' ? (
                <Sun className="size-4" style={{ color: 'var(--color-mode-day)' }} />
              ) : (
                <Moon className="size-4" style={{ color: 'var(--color-mode-night)' }} />
              )}
              {t.shift === 'DAY' ? 'DAY(주간)' : 'NIGHT(야간)'}
            </span>
            <span className="text-xs tabular-nums text-white/70">
              {t.startTime} - {t.endTime}
            </span>
          </button>
        ))}
      </div>

      {/* 월간 달력 */}
      <MonthCalendar year={2026} month={8} schedule={schedule} onSelectDay={setEditDay} />

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
                variant={editDay?.shift === s ? 'default' : 'secondary'}
                onClick={() => editDay && setDayShift(editDay.date, s)}
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
