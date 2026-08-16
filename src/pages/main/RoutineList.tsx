import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

/**
 * 오늘의 루틴 목록 (임시) — 시간순 6~7줄, 각 줄 [근거][조정].
 * 지난 항목 흐리게 · 수면 부족 표시 · Quick Return 경고 배너.
 * TODO: RoutineResult 연동, [조정]→재설계 항목 반영, 실제 현재시각.
 */
export interface RoutineRow {
  time: string
  label: string
  reason?: string[]
  source?: string
}

export const INITIAL_ROUTINE: RoutineRow[] = [
  {
    time: '09:00',
    label: '주 수면 시작',
    reason: [
      '퇴근 후 가장 긴 수면 블록을 먼저 확보해요.',
      '빛을 차단하면 잠들기까지 시간이 줄어듭니다.',
      '내일도 나이트라 기존 리듬을 유지해요.',
    ],
    source: 'NIOSH 교대근무 가이드',
  },
  {
    time: '16:00',
    label: '기상',
    reason: [
      '목표 수면 7시간을 확보한 기상 시각이에요.',
      '기상 직후 밝은 빛을 쬐면 리듬이 안정돼요.',
    ],
    source: 'HSE 교대근무 가이드',
  },
  {
    time: '17:00',
    label: '주요 식사',
    reason: [
      '기상 후 1시간 내 주요 식사로 대사 리듬을 맞춰요.',
      '근무 전 충분한 에너지를 확보합니다.',
    ],
    source: '수면·영양 연구',
  },
  {
    time: '19:30',
    label: '카페인 제한 시작',
    reason: ['취침 약 6시간 전부터 카페인을 제한해요.', '카페인 반감기는 평균 5~6시간입니다.'],
    source: '수면 연구',
  },
  {
    time: '21:00',
    label: '큰 식사 제한 시작',
    reason: [
      '근무 중 큰 식사는 소화 부담과 졸음을 유발해요.',
      '필요하면 소량의 간식으로 대체하세요.',
    ],
    source: 'NIOSH 교대근무 가이드',
  },
  {
    time: '22:00',
    label: '출근',
    reason: ['근무 시작 시각이에요.', '준비·통근 시간을 역산해 기상·식사 시각을 맞췄어요.'],
    source: '개인 설정 기반',
  },
]

const NOW_MIN = 14 * 60 + 30 // 목 현재 시각 14:30
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))

const SLEEP_DEFICIT_MIN = 40 // 목: 어젯밤 부족량
const QUICK_RETURN = true // 목: 휴식 빠듯

export function RoutineList({ items = INITIAL_ROUTINE }: { items?: RoutineRow[] }) {
  const [detail, setDetail] = useState<RoutineRow | null>(null)

  return (
    <div>
      {/* Quick Return 경고 배너 */}
      {QUICK_RETURN && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#B500F7]/40 bg-[#B500F7]/15 px-3 py-2.5 backdrop-blur-md">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" style={{ color: '#e29bff' }} />
          <p className="text-xs leading-relaxed text-white/90">
            다음 근무까지 휴식이 빠듯한 날이에요. 수면 블록을 먼저 확보하세요.
          </p>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/90">오늘의 루틴</h2>
        {SLEEP_DEFICIT_MIN > 0 && (
          <span className="text-xs text-[#00F7EF]">어젯밤 {SLEEP_DEFICIT_MIN}분 부족</span>
        )}
      </div>

      <ul className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/25 backdrop-blur-md">
        {items.map((item, i) => {
          const past = toMin(item.time) < NOW_MIN
          return (
            <li
              key={i}
              className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-b-0"
              style={{ opacity: past ? 0.4 : 1 }}
            >
              <span className="w-12 text-sm font-semibold tabular-nums text-white">
                {item.time}
              </span>
              <span className="flex-1 text-sm text-white/90">{item.label}</span>
              <button
                onClick={() => item.reason && setDetail(item)}
                disabled={!item.reason}
                className="rounded-md px-2 py-1 text-xs text-white/70 enabled:hover:bg-white/10 disabled:opacity-40"
              >
                근거
              </button>
              <button className="rounded-md px-2 py-1 text-xs text-white/70 hover:bg-white/10">
                조정
              </button>
            </li>
          )
        })}
      </ul>

      {/* 근거 설명 시트 — 왜 이 시각인지 3줄 + 출처 */}
      <Sheet open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="bottom" className="mx-auto max-w-[480px] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>
              {detail?.time} · {detail?.label}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2 px-6 pb-2">
            {detail?.reason?.map((r, i) => (
              <p key={i} className="flex gap-2 text-sm text-white/85">
                <span style={{ color: '#00F7EF' }}>·</span>
                {r}
              </p>
            ))}
            {detail?.source && <p className="pt-1 text-xs text-white/45">출처: {detail.source}</p>}
          </div>
          <div className="p-4">
            <Button
              variant="ghost"
              onClick={() => setDetail(null)}
              className="w-full text-white/80 hover:bg-white/10 hover:text-white"
            >
              닫기
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
