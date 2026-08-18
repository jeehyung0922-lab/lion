import MyPageDetailLayout, { DetailCard, DetailRow } from './MyPageDetailLayout'
import { MOCK_MY_PAGE_DATA } from './mockMyPageData'

export default function ProfileEditPage() {
  return (
    <MyPageDetailLayout title="프로필 수정">
      <DetailCard>
        <div className="flex items-center gap-4 px-5 py-5">
          <img
            src="/mypage/profile.png"
            alt="사용자 프로필"
            className="h-[72px] w-[72px] shrink-0 rounded object-cover"
          />
          <div className="tracking-[-0.05em]">
            <p className="text-[17px] leading-none">{MOCK_MY_PAGE_DATA.name}</p>
            <p className="mt-2 text-[12px] leading-[1.4] text-white/50">
              {MOCK_MY_PAGE_DATA.caption}
            </p>
          </div>
        </div>
        <DetailRow title="이름" description={MOCK_MY_PAGE_DATA.name} />
        <DetailRow title="출근 준비 시간" description={`${MOCK_MY_PAGE_DATA.prepMinutes}분`} />
        <DetailRow title="통근 시간" description={`${MOCK_MY_PAGE_DATA.commuteMinutes}분`} />
        <DetailRow
          title="목표 수면"
          description={`${MOCK_MY_PAGE_DATA.targetSleepMinutes / 60}시간`}
        />
        <DetailRow title="낮잠 가능 여부" description={MOCK_MY_PAGE_DATA.napAvailable ? '가능' : '불가'} />
        <DetailRow
          title="낮잠 가능 시간"
          description={`${MOCK_MY_PAGE_DATA.napAvailableMinutes}분`}
        />
        <DetailRow title="생활 리듬 선호" description={MOCK_MY_PAGE_DATA.rhythmPreference} />
      </DetailCard>

      <button
        type="button"
        disabled
        className="mt-5 h-11 w-full rounded-xl border border-white/20 bg-white/[0.07] text-[13px] text-white/35 disabled:cursor-not-allowed"
      >
        저장
      </button>
    </MyPageDetailLayout>
  )
}
