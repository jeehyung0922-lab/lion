import MyPageDetailLayout, { DetailCard, DetailRow } from './MyPageDetailLayout'

export default function TermsPage() {
  return (
    <MyPageDetailLayout title="이용약관">
      <DetailCard>
        <DetailRow title="서비스 이용약관" description="약관 내용 준비 중" />
        <DetailRow title="개인정보 처리방침" description="개인정보 처리방침 준비 중" />
      </DetailCard>
    </MyPageDetailLayout>
  )
}
