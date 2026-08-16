import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_FORM, type OnboardingForm } from './onboardingData'
import { PersonalizeStep } from './steps/PersonalizeStep'
import { ScheduleStep } from './steps/ScheduleStep'
import { AiResultStep } from './steps/AiResultStep'

/**
 * 온보딩 (내 담당) — 스플래시(SplashPage)에서 진입.
 * 순서: 개인화 입력 → 근무표 등록 → AI 분석 확인·보정 → 메인
 * 저장된 프로필이 있으면 기존값을 프리필해 확인·수정 가능.
 * 데이터는 목(mock) 기반. TODO: /parse-schedule 연동, 프로필 서버 저장.
 */
type Step = 0 | 1 | 2

function loadForm(): OnboardingForm {
  const saved = localStorage.getItem('kinglion.profile')
  if (!saved) return DEFAULT_FORM
  try {
    return { ...DEFAULT_FORM, ...JSON.parse(saved) }
  } catch {
    return DEFAULT_FORM
  }
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(0)
  const [form, setForm] = useState<OnboardingForm>(loadForm)

  function update(patch: Partial<OnboardingForm>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  function finish() {
    localStorage.setItem('kinglion.profile', JSON.stringify(form))
    localStorage.setItem('kinglion.onboarded', '1')
    navigate('/home', { replace: true })
  }

  return (
    <div className="h-full">
      {step === 0 && <PersonalizeStep form={form} update={update} onNext={() => setStep(1)} />}
      {step === 1 && <ScheduleStep onRegistered={() => setStep(2)} />}
      {step === 2 && <AiResultStep onConfirm={finish} />}
    </div>
  )
}
