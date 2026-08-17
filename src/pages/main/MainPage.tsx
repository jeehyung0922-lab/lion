import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ModeKey } from '../../types'
import { MoonGauge } from './MoonGauge'
import { RoutineTable } from './RoutineTable'
import { MAIN_THEMES, MODE_TO_THEME } from './mainTheme'

/**
 * 메인페이지 (홈, 내 담당) — 근무 유형에 따라 배경색이 바뀜(4종).
 * 오늘의 모드 · 시차 표시(+게이지) · 오늘의 루틴 표(박스 클릭 시 근거 드롭다운) · 일정 조율(AI 대화)
 * 목 데이터 기반. TODO: 판정/RoutineResult/시차 매핑 연동.
 */

// 배경/라벨 테스트용 — 실제로는 판정 결과 모드 사용.
const MOCK_MODE: ModeKey = 'OFF_RHYTHM_MAINTAIN'
const MODE_REASON =
  '직전 근무와 다음 근무가 모두 나이트예요. 낮 생활로 완전히 돌아가지 않고 기존 수면 블록을 최대한 유지합니다.'
const MOCK_NAME = '박일하'
const MOCK_CITY = 'London'
const MOCK_CROSS_HOURS = 7
const MOCK_TARGET_SLEEP = 7

export default function MainPage() {
  const navigate = useNavigate()
  const [showReason, setShowReason] = useState(false)
  const theme = MAIN_THEMES[MODE_TO_THEME[MOCK_MODE]]

  return (
    <div className="min-h-full w-full px-5 pt-14 pb-28" style={{ background: theme.gradient }}>
      {/* 헤더: 시차 + 오늘의 모드(탭 → 사유) */}
      <div className="flex items-start justify-between">
        <span className="text-lg font-semibold text-white underline decoration-white/40 underline-offset-4">
          시차
        </span>
        <button onClick={() => setShowReason((v) => !v)} className="text-sm text-white/90">
          {theme.label}
        </button>
      </div>

      {showReason && (
        <div className="mt-2 ml-auto max-w-[85%] rounded-xl border border-white/10 bg-[#111111]/40 px-3 py-2.5 text-xs leading-relaxed text-white/85 backdrop-blur-md">
          {MODE_REASON}
        </div>
      )}

      {/* 시차 표시 + 무월 게이지 */}
      <div className="mt-7 flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xl leading-snug font-bold text-white">
            현재 {MOCK_NAME} 님은
            <br />
            {MOCK_CITY} 시간대에 살고 있어요.
          </p>
          <button
            onClick={() => navigate('/collectbook')}
            className="mt-2 rounded-md px-2.5 py-1 text-xs font-medium text-white"
            style={{ background: theme.accent }}
          >
            이번 주는 {MOCK_CROSS_HOURS}시간을 건넙니다.
          </button>
        </div>
        <MoonGauge hours={MOCK_TARGET_SLEEP} />
      </div>

      {/* 오늘의 루틴 표 */}
      <div className="mt-7">
        <RoutineTable accent={theme.accent} />
      </div>

      {/* 일정 조율 (AI 대화) */}
      <button
        onClick={() => navigate('/coordinate')}
        className="mt-4 w-full rounded-xl bg-[#111111]/25 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-[#111111]/40"
      >
        일정 조율하기 +
      </button>
    </div>
  )
}
