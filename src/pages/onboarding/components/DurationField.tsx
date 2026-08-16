import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { formatDuration } from '../onboardingData'
import { DurationWheel } from './WheelPicker'

interface DurationFieldProps {
  label: string
  value: number
  onChange: (min: number) => void
}

/** 라벨 + 현재값을 보여주는 카드. 탭하면 바텀시트에서 휠 피커로 수정. */
export function DurationField({ label, value, onChange }: DurationFieldProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)

  function openSheet() {
    setDraft(value)
    setOpen(true)
  }

  function confirm() {
    onChange(draft)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          onClick={openSheet}
          className="flex w-full flex-col items-start gap-1 rounded-lg border border-white/10 bg-[#111111]/30 px-4 py-3.5 text-left backdrop-blur-md transition-colors hover:bg-[#111111]/45"
        >
          <span className="text-xs text-[#888888]">{label}</span>
          <span className="text-[17px] font-normal tracking-[-0.05em] text-white">
            {formatDuration(value)}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-[480px] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
        </SheetHeader>
        <div className="px-6 py-2">
          <DurationWheel value={draft} onChange={setDraft} />
        </div>
        <SheetFooter>
          <Button
            onClick={confirm}
            className="border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15"
          >
            확인
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            취소
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
