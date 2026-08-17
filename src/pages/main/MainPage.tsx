import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MODE_META } from '../../constants/modes'
import type { ModeKey } from '../../types'
import { MoonGauge } from './MoonGauge'
import { DayDial } from './DayDial'
import { RoutineList, INITIAL_ROUTINE, type RoutineRow } from './RoutineList'
import { CheckInCard } from './CheckInCard'
import { ReplanSheet } from './ReplanSheet'

/**
 * 메인페이지 (홈, 내 담당) — S2 명세.
 * 오늘의 모드(사유 툴팁) · 시차 표시(+게이지) · 24시간 눈금 · 오늘의 루틴 목록 · 재설계 진입
 * 목 데이터 기반. TODO: 판정/RoutineResult/시차 매핑 연동.
 */

const MOCK_MODE: ModeKey = 'OFF_RHYTHM_MAINTAIN'
const MODE_REASON =
  '직전 근무와 다음 근무가 모두 나이트예요. 낮 생활로 완전히 돌아가지 않고 기존 수면 블록을 최대한 유지합니다.'
const MOCK_NAME = '박일하'
const MOCK_CITY = 'London'
const MOCK_CROSS_HOURS = 7
const MOCK_TARGET_SLEEP = 7
// 오늘 근무유형(목). 퇴근 체크인은 NIGHT/EVENING 근무 종료 시에만 노출.
const TODAY_SHIFT = 'OFF'
const SHOW_CLOCKOUT_CHECKIN = (['NIGHT', 'EVENING'] as readonly string[]).includes(TODAY_SHIFT)

// 홈 배경: 보라(위) → 청록(아래)
const HOME_GRADIENT = 'linear-gradient(160deg, #4a1a6e 0%, #2f2578 32%, #14495f 66%, #0d5346 100%)'

export default function MainPage() {
  const navigate = useNavigate()
  const [showReason, setShowReason] = useState(false)
  const [replanOpen, setReplanOpen] = useState(false)
  const [routine, setRoutine] = useState<RoutineRow[]>(INITIAL_ROUTINE)
  const mode = MODE_META[MOCK_MODE]

  return (
    <div className="min-h-full w-full px-6 pt-14 pb-28" style={{ background: HOME_GRADIENT }}>
      {/* 헤더: 시차 + 오늘의 모드(탭 → 사유) */}
      <div className="flex items-start justify-between">
        <span className="text-lg font-semibold text-white underline decoration-white/40 underline-offset-4">
          시차
        </span>
        <button
          onClick={() => setShowReason((v) => !v)}
          className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm text-white"
          style={{
            borderColor: `color-mix(in srgb, ${mode.colorVar} 55%, transparent)`,
            background: `color-mix(in srgb, ${mode.colorVar} 18%, transparent)`,
          }}
        >
          <span className="size-2 rounded-full" style={{ background: mode.colorVar }} />
          {mode.label.replace('·', '/')}
        </button>
      </div>

      {/* 오늘의 모드 판정 사유 툴팁 */}
      {showReason && (
        <div className="mt-2 ml-auto max-w-[85%] rounded-xl border border-white/10 bg-[#111111]/40 px-3 py-2.5 text-xs leading-relaxed text-white/85 backdrop-blur-md">
          {MODE_REASON}
        </div>
      )}

      {/* 시차 표시 + 무월 게이지 */}
      <div className="mt-8 flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xl leading-snug font-bold text-white">
            현재 {MOCK_NAME} 님은
            <br />
            {MOCK_CITY} 시간대에 살고 있어요.
          </p>
          <button
            onClick={() => navigate('/collectbook')}
            className="mt-2 text-sm underline decoration-[#00F7EF]/60 underline-offset-4"
            style={{ color: '#00F7EF' }}
          >
            이번 주는 {MOCK_CROSS_HOURS}시간을 건넙니다.
          </button>
        </div>
        <MoonGauge hours={MOCK_TARGET_SLEEP} />
      </div>

      {/* 체크인 카드 (무시 가능) — 기상은 항상, 퇴근은 NIGHT/EVENING 근무 종료 시 */}
      <div className="mt-6 space-y-2">
        <CheckInCard variant="wake" />
        {SHOW_CLOCKOUT_CHECKIN && <CheckInCard variant="clockout" />}
      </div>

      {/* 24시간 눈금 */}
      <div className="mt-6">
        <DayDial />
      </div>

      {/* 오늘의 루틴 목록 */}
      <div className="mt-6">
        <RoutineList items={routine} />
      </div>

      {/* 재설계 진입 */}
      <button
        onClick={() => setReplanOpen(true)}
        className="mt-6 w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15"
      >
        계획이 바뀌었나요? 다시 조정하기
      </button>

      {/* 재설계 시트 */}
      <ReplanSheet
        open={replanOpen}
        onOpenChange={setReplanOpen}
        routine={routine}
        onConfirm={setRoutine}
      />
    </div>
  )
}
