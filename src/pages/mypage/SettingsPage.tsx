import MyPageDetailLayout, { DetailCard, DetailRow } from './MyPageDetailLayout'

export default function SettingsPage() {
  return (
    <MyPageDetailLayout title="앱 설정">
      <DetailCard>
        <DetailRow title="알림 설정" description="알림 설정 기능 준비 중" />
        <DetailRow title="앱 정보" description="앱 정보 영역 준비 중" />
        <DetailRow title="홈 화면에 설치" description="PWA 설치 안내 영역 준비 중" />
        <DetailRow title="새로 시작하기" description="초기화 기능 준비 중" />
      </DetailCard>
    </MyPageDetailLayout>
  )
}
