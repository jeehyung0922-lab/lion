import MyPageDetailLayout, { DetailCard, DetailRow } from './MyPageDetailLayout'

export default function SupportPage() {
  return (
    <MyPageDetailLayout title="고객센터 및 서비스 지원">
      <DetailCard>
        <DetailRow title="자주 묻는 질문" description="FAQ 영역 준비 중" />
        <DetailRow title="문의하기" description="문의 기능 준비 중" />
        <DetailRow title="서비스 정보" description="서비스 안내 영역 준비 중" />
      </DetailCard>
    </MyPageDetailLayout>
  )
}
