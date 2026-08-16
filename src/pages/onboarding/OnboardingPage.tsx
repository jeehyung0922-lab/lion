import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_FORM, type OnboardingForm } from './onboardingData'
import { SplashStep } from './steps/SplashStep'
import { PersonalizeStep } from './steps/PersonalizeStep'
import { ScheduleStep } from './steps/ScheduleStep'
import { AiResultStep } from './steps/AiResultStep'

/**
 * 온보딩 (내 담당)
 * 순서: 스플래시 → 개인화 입력 → 근무표 등록 → AI 분석 확인·보정 → 메인
 * 데이터는 목(mock) 기반. TODO: /parse-schedule 연동, 프로필 서버 저장.
 */
type Step = 0 | 1 | 2 | 3

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(0)
  const [form, setForm] = useState<OnboardingForm>(DEFAULT_FORM)

  function update(patch: Partial<OnboardingForm>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  function finish() {
    // 스캐폴드: 프로필 저장 + 온보딩 완료 플래그
    localStorage.setItem('kinglion.profile', JSON.stringify(form))
    localStorage.setItem('kinglion.onboarded', '1')
    navigate('/', { replace: true })
  }

  return (
    <div className="h-full">
      {step === 0 && <SplashStep onNext={() => setStep(1)} />}
      {step === 1 && <PersonalizeStep form={form} update={update} onNext={() => setStep(2)} />}
      {step === 2 && <ScheduleStep onRegistered={() => setStep(3)} />}
      {step === 3 && <AiResultStep onConfirm={finish} />}
    </div>
  )
}
