import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { StepShell, STEP_GRADIENTS } from '../components/StepShell'
import { api, ApiError, asRowLabelError, fileToBase64, type ParseScheduleResponse } from '@/lib/api'

interface ScheduleStepProps {
  /** 파싱 성공 시 결과와 함께 다음 단계로 */
  onParsed: (result: ParseScheduleResponse) => void
  onBack?: () => void
}

/**
 * 분석 중 문구 — 실제로 서버가 하는 일 순서대로. 한 줄로 5~15초를 버티면 체감이 길어진다.
 * 파싱은 두 번 돈다(전체 훑기 → 내 줄만 다시 읽기). 두 번 다 같은 화면이 뜨면 진행이 안 되는 것처럼
 * 보이므로 문구를 갈라 놓는다 — 1차는 "사람을 찾는" 단계, 2차는 "내 근무를 읽는" 단계.
 */
const LOADING_STEPS: Record<AnalyzePhase, { title: string; steps: string[] }> = {
  initial: {
    title: '근무표를 살펴보는 중',
    steps: ['근무표를 펼치고 있어요', '표에서 사람을 찾고 있어요', '이름을 정리하고 있어요'],
  },
  row: {
    title: '내 근무를 읽는 중',
    steps: ['내 줄만 다시 보고 있어요', '날짜를 맞추고 있어요', '근무 유형을 정리하고 있어요'],
  },
}

/** initial = 내 줄을 모른 채 표 전체를 훑는 1차, row = 고른 줄만 다시 읽는 2차 */
type AnalyzePhase = 'initial' | 'row'

/**
 * 1. 근무표 등록 (온보딩 첫 단계)
 * intro(불러오기) → uploaded(미리보기 후 등록) → loading(분석) → 필요하면 rowpick(내 줄 고르기).
 * 사진/파일 업로드만 지원.
 *
 * 최초 호출은 myRowLabel 없이 /api/onboarding/schedule/parse 호출.
 * 단체 근무표라 AI가 본인 행을 특정 못하면 422(ROW_LABEL_REQUIRED)+rowLabels가 오는데,
 * 병동 표는 거의 항상 여러 줄이라 이건 예외가 아니라 정상 경로다 — 에러 문구가 아니라
 * 별도 선택 화면(rowpick)으로 띄우고, 고른 값으로 myRowLabel을 채워 재호출한다.
 */
export function ScheduleStep({ onParsed, onBack }: ScheduleStepProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<AnalyzePhase | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rowPick, setRowPick] = useState<{ labels: string[]; previews?: string[] } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function pickFile() {
    inputRef.current?.click()
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setError(null)
    setRowPick(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function register(myRowLabel?: string) {
    if (!file) return
    setAnalyzing(myRowLabel ? 'row' : 'initial')
    setError(null)
    setRowPick(null)
    try {
      const imageBase64 = await fileToBase64(file)
      const result = await api.parseSchedule({ imageBase64, myRowLabel })
      onParsed(result)
    } catch (e) {
      const rowLabelErr = asRowLabelError(e)
      if (rowLabelErr) {
        setRowPick({ labels: rowLabelErr.rowLabels, previews: rowLabelErr.rowPreviews })
      } else if (e instanceof ApiError) {
        // 서버가 응답은 했지만(4xx/5xx) 분석에 실패한 경우
        setError('근무표를 분석하지 못했어요. 다시 시도해주세요.')
      } else {
        // fetch 자체가 실패 — 서버가 꺼져있거나 네트워크 문제
        setError('서버에 연결할 수 없어요. 인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setAnalyzing(null)
    }
  }

  // 분석 중 — 사진을 띄우지 않고 고정 그래픽 위를 초록 바가 왕복한다(근무표 모양이 제각각이라)
  if (analyzing) return <AnalyzingView phase={analyzing} />

  // 내 줄 고르기 — 정식 단계로 띄운다
  if (rowPick) {
    return (
      <RowPickView
        labels={rowPick.labels}
        previews={rowPick.previews}
        onPick={register}
        onBack={() => {
          setRowPick(null)
        }}
      />
    )
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
              className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/15"
            >
              근무표 등록하기
            </Button>
            {/* 실수로 다른 근무표를 올린 경우 다시 선택 */}
            <Button
              onClick={pickFile}
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
          <p className="mt-3 text-[13px] leading-relaxed tracking-[-0.025em] text-white/55">
            병동 전체가 찍힌 표도 괜찮아요.
            <br />
            어떤 모양이든 그대로 올려주세요.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center">
          <p className="mt-2 mb-6 text-base font-medium text-white/90">근무표를 불러왔습니다.</p>
          <button
            type="button"
            onClick={pickFile}
            className="w-fit max-w-full overflow-hidden rounded-2xl border border-white/20"
          >
            <img
              src={preview}
              alt="근무표 미리보기"
              className="block h-auto max-h-[55vh] max-w-full object-contain"
            />
          </button>
          {error && <p className="mt-3 text-xs text-[#ff8fb0]">{error}</p>}
        </div>
      )}
    </StepShell>
  )
}

/**
 * 분석 중 화면 — 업로드한 사진 위를 훑는 연출은 쓰지 않는다.
 * 근무표는 행 수·날짜 수·축 방향이 제각각이라 사진 좌표에 기대는 연출은 어떤 표에서는 어긋난다.
 * 대신 우리가 정한 고정 그래픽 위를 초록 바가 왕복한다.
 */
function AnalyzingView({ phase }: { phase: AnalyzePhase }) {
  const { title, steps } = LOADING_STEPS[phase]
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % steps.length), 1600)
    return () => clearInterval(t)
  }, [steps.length])

  return (
    <StepShell gradient={STEP_GRADIENTS.scheduleUploaded}>
      <div className="flex flex-1 flex-col justify-center">
        {/* 고정 그래픽: 근무표를 추상화한 격자 + 그 위를 오가는 초록 바 */}
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-[#111111]/30 p-4 backdrop-blur-md">
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, r) => (
              <div key={r} className="flex gap-1.5">
                <span className="h-3 w-10 shrink-0 rounded-[3px] bg-white/20" />
                {Array.from({ length: 8 }).map((_, c) => (
                  <span
                    key={c}
                    className="h-3 flex-1 rounded-[3px]"
                    // 규칙적인 격자가 아니라 근무가 띄엄띄엄 찍힌 표처럼 보이게 농도를 흩는다
                    style={{ background: `rgba(255,255,255,${(r * 3 + c * 5) % 4 === 0 ? 0.22 : 0.08})` }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div
            className="scan-sweep pointer-events-none absolute inset-x-0 top-0 h-12"
            style={{
              background:
                'linear-gradient(180deg, transparent, rgba(171,255,36,0.38), transparent)',
            }}
          />
        </div>

        <p className="mt-8 text-center text-[12px] tracking-[-0.025em] text-white/55">{title}</p>
        <p className="mt-2 text-center text-[20px] font-semibold tracking-[-0.03em] text-white">
          {steps[idx]}
        </p>
        <p className="mt-2 text-center text-[13px] tracking-[-0.025em] text-white/55">
          보통 10초 안에 끝나요
        </p>

        {/* 단계 표시 — 몇 단계 중 어디쯤인지 */}
        <div className="mt-5 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === idx ? 'w-6 bg-[#ABFF24]' : 'w-1.5 bg-white/25'
              }`}
            />
          ))}
        </div>
      </div>
    </StepShell>
  )
}

/**
 * 내 줄 고르기 — 병동 표는 거의 항상 여러 줄이라 정상 경로다.
 * 사진 위에 좌표로 표시하지 않는다(vision이 bbox를 안정적으로 주지 못함) — 읽어낸 이름으로 고르게 한다.
 */
function RowPickView({
  labels,
  previews,
  onPick,
  onBack,
}: {
  labels: string[]
  /** rowLabels와 짝이 맞을 때만 온다 — 없으면(구버전 백엔드 등) 이름만 보여준다 */
  previews?: string[]
  onPick: (label: string) => void
  onBack: () => void
}) {
  return (
    <StepShell
      gradient={STEP_GRADIENTS.scheduleUploaded}
      onBack={onBack}
      footer={
        <p className="text-center text-[12px] tracking-[-0.025em] text-white/55">
          이름을 고르면 그 줄만 다시 읽어요
        </p>
      }
    >
      <p className="text-[20px] leading-snug font-semibold tracking-[-0.03em] text-white">
        어느 줄이 본인인가요?
      </p>
      <p className="mt-2 text-[13px] leading-relaxed tracking-[-0.025em] text-white/70">
        근무표에서 이 이름들을 읽었어요.
      </p>

      <div className="mt-5 space-y-2">
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onPick(label)}
            className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#111111]/30 px-4 py-3.5 text-left backdrop-blur-md transition-colors hover:bg-[#111111]/45"
          >
            <span>
              <span className="block text-[13px] tracking-[-0.025em] text-white">{label}</span>
              {previews?.[i] && (
                <span className="mt-0.5 block font-mono text-[11px] tracking-[-0.01em] text-white/40">
                  {previews[i]}
                </span>
              )}
            </span>
            <span className="text-[12px] tracking-[-0.025em] text-white/45">이 줄이에요</span>
          </button>
        ))}
      </div>
    </StepShell>
  )
}
