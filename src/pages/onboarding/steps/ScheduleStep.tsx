import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { StepShell, STEP_GRADIENTS } from '../components/StepShell'

interface ScheduleStepProps {
  /** 등록 완료 시 목 파싱 트리거 → AI 결과 단계로 */
  onRegistered: (previewUrl: string) => void
}

/**
 * 2. 근무표 등록
 * intro(불러오기) → uploaded(미리보기 후 등록). 사진/파일 업로드만 지원.
 */
export function ScheduleStep({ onRegistered }: ScheduleStepProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function pickFile() {
    inputRef.current?.click()
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  const uploaded = preview !== null

  return (
    <StepShell
      gradient={uploaded ? STEP_GRADIENTS.scheduleUploaded : STEP_GRADIENTS.scheduleIntro}
      footer={
        uploaded ? (
          <Button
            onClick={() => onRegistered(preview!)}
            className="h-12 w-full rounded-2xl text-base font-semibold"
          >
            근무표 등록하기
          </Button>
        ) : (
          <Button
            onClick={pickFile}
            variant="outline"
            className="h-12 w-full rounded-2xl border-white/30 bg-white/5 text-base font-semibold backdrop-blur-sm"
          >
            근무표 불러오기
          </Button>
        )
      }
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {!uploaded ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-base leading-relaxed text-white/85">
            근무표만 넣어주시면,
            <br />
            오늘 나에게 어떤 리듬이 필요한지 알려드릴게요
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center">
          <p className="mb-6 mt-2 text-base font-medium text-white/90">근무표를 불러왔습니다.</p>
          <button
            type="button"
            onClick={pickFile}
            className="aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl border border-white/20 bg-white/90"
          >
            <img src={preview} alt="근무표 미리보기" className="h-full w-full object-cover" />
          </button>
        </div>
      )}
    </StepShell>
  )
}
