import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { StepShell, STEP_GRADIENTS } from '../components/StepShell'
import { api, ApiError, asRowLabelError, fileToBase64, type ParseScheduleResponse } from '@/lib/api'

interface ScheduleStepProps {
  /** 파싱 성공 시 결과와 함께 다음 단계로 */
  onParsed: (result: ParseScheduleResponse) => void
  onBack?: () => void
}

/**
 * 2. 근무표 등록
 * intro(불러오기) → uploaded(미리보기 후 등록). 사진/파일 업로드만 지원.
 * 최초 호출은 myRowLabel 없이 /api/onboarding/schedule/parse 호출.
 * 단체 근무표라 AI가 본인 행을 특정 못하면 422(ROW_LABEL_REQUIRED)+rowLabels가 오는데,
 * 그 목록에서 사용자가 고른 값으로 myRowLabel을 채워 재호출한다.
 */
export function ScheduleStep({ onParsed, onBack }: ScheduleStepProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rowLabels, setRowLabels] = useState<string[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function pickFile() {
    inputRef.current?.click()
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setError(null)
    setRowLabels(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function register(myRowLabel?: string) {
    if (!file) return
    setLoading(true)
    setError(null)
    setRowLabels(null)
    try {
      const imageBase64 = await fileToBase64(file)
      const result = await api.parseSchedule({ imageBase64, myRowLabel })
      onParsed(result)
    } catch (e) {
      const rowLabelErr = asRowLabelError(e)
      if (rowLabelErr) {
        setRowLabels(rowLabelErr.rowLabels)
      } else if (e instanceof ApiError) {
        // 서버가 응답은 했지만(4xx/5xx) 분석에 실패한 경우
        setError('근무표를 분석하지 못했어요. 다시 시도해주세요.')
      } else {
        // fetch 자체가 실패 — 서버가 꺼져있거나 네트워크 문제
        setError('서버에 연결할 수 없어요. 인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  const uploaded = preview !== null

  return (
    <StepShell
      gradient={uploaded ? STEP_GRADIENTS.scheduleUploaded : STEP_GRADIENTS.scheduleIntro}
      onBack={onBack}
      footer={
        uploaded ? (
          <div className="space-y-2">
            <Button
              onClick={() => register()}
              disabled={loading}
              className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/15 disabled:opacity-50"
            >
              {loading ? '분석 중…' : '근무표 등록하기'}
            </Button>
            {/* 실수로 다른 근무표를 올린 경우 다시 선택 */}
            <Button
              onClick={pickFile}
              disabled={loading}
              variant="ghost"
              className="h-11 w-full rounded-2xl text-sm font-normal text-white/75 hover:bg-transparent hover:font-bold hover:text-white"
            >
              근무표 다시 불러오기
            </Button>
          </div>
        ) : (
          <Button
            onClick={pickFile}
            className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/15"
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
            disabled={loading}
            className="w-fit max-w-full overflow-hidden rounded-2xl border border-white/20"
          >
            <img
              src={preview}
              alt="근무표 미리보기"
              className="block h-auto max-h-[55vh] max-w-full object-contain"
            />
          </button>
          {error && <p className="mt-3 text-xs text-[#ff8fb0]">{error}</p>}
          {rowLabels && (
            <div className="mt-4 w-full max-w-[280px]">
              <p className="mb-2 text-center text-xs text-white/70">
                근무표에서 본인 이름을 선택해주세요
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {rowLabels.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => register(label)}
                    disabled={loading}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur-sm hover:bg-white/15 disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </StepShell>
  )
}
