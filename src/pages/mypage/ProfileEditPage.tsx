import MyPageDetailLayout, { DetailCard } from './MyPageDetailLayout'

/** kinglion.profile(온보딩 저장값)에서 이름만 읽어옴 — 실패 시 빈 문자열 */
function loadProfileName(): string {
  try {
    const saved = JSON.parse(localStorage.getItem('kinglion.profile') ?? '{}')
    return typeof saved.name === 'string' ? saved.name : ''
  } catch {
    return ''
  }
}

export default function ProfileEditPage() {
  const name = loadProfileName()

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
            <p className="text-[12px] text-white/50">프로필 이미지</p>
            <p className="mt-2 text-[13px]">이미지 변경 기능 준비 중</p>
          </div>
        </div>
        <div className="border-t border-white/15 px-5 py-4 tracking-[-0.05em]">
          <p className="text-[12px] text-white/50">이름</p>
          <p className="mt-2 text-[13px]">{name || '이름 없음'}</p>
        </div>
        <div className="border-t border-white/15 px-5 py-4 tracking-[-0.05em]">
          <p className="text-[12px] text-white/50">사용자 정보</p>
          <p className="mt-2 text-[13px]">사용자 정보 수정 기능 준비 중</p>
        </div>
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
