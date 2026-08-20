import { useState } from 'react'
import { api, asScheduleMissingTodayError } from '@/lib/api'

/**
 * 홈에서 오늘 루틴이 404(근무표 범위 밖)일 때 뜨는 카드.
 * "시작일만 옮기기"(가벼움, PATCH /api/onboarding/schedule/start-date — 요일 패턴 유지)를
 * 기본으로 보여주고, "근무표 새로 등록하기"(무거움, 사진부터 다시 — 기존 온보딩 재사용)는 아래로 내린다.
 * 시작일만 옮기면 개별 날짜에 따로 고친 시각이 있어도 전부 초기화되므로, 확정 전에 항상 경고를 보여준다.
 */

function todayLocalISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface StartDateFixCardProps {
  /** 시작일 이동 성공 시 오늘 루틴을 다시 불러오라는 신호 */
  onFixed: () => void
  /** "근무표 새로 등록하기" 선택 시 */
  onReRegister: () => void
}

export function StartDateFixCard({ onFixed, onReRegister }: StartDateFixCardProps) {
  const [pickingDate, setPickingDate] = useState(false)
  const [newStartDate, setNewStartDate] = useState(todayLocalISO)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await api.patchScheduleStartDate(newStartDate)
      onFixed()
    } catch (e) {
      const missingToday = asScheduleMissingTodayError(e)
      setError(missingToday?.message ?? '시작일을 적용하지 못했어요. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-white/20 bg-[#111111]/25 p-4 backdrop-blur-md">
      <p className="text-[13px] leading-relaxed tracking-[-0.025em] text-white/85">
        등록된 근무표에 오늘 날짜가 없어요.
        <br />
        요일 패턴은 그대로 두고 시작일만 옮길 수 있어요.
      </p>

      {pickingDate ? (
        <div className="mt-3 space-y-2.5">
          <p className="text-[12px] leading-relaxed tracking-[-0.025em] text-white/55">
            하루씩 따로 고친 시각이 있다면 이 작업으로 초기화돼요.
          </p>
          <input
            type="date"
            value={newStartDate}
            onChange={(e) => setNewStartDate(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-[#111111]/40 px-3 py-2.5 text-[13px] tracking-[-0.025em] text-white [color-scheme:dark]"
          />
          {error && <p className="text-[12px] leading-relaxed text-[#ff8fb0]">{error}</p>}
          <button
            onClick={confirm}
            disabled={submitting}
            className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 text-[13px] font-medium tracking-[-0.025em] text-white transition-colors hover:bg-white/15 disabled:opacity-60"
          >
            {submitting ? '옮기는 중…' : '이 날짜로 옮기기'}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <button
            onClick={() => setPickingDate(true)}
            className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 text-[13px] font-medium tracking-[-0.025em] text-white transition-colors hover:bg-white/15"
          >
            시작일만 옮기기
          </button>
          <button
            onClick={onReRegister}
            className="w-full rounded-lg border border-white/10 bg-transparent py-2.5 text-[12px] tracking-[-0.025em] text-white/60 transition-colors hover:bg-white/5"
          >
            근무표 새로 등록하기
          </button>
        </div>
      )}
    </div>
  )
}
