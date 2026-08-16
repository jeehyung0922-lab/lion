# 시차 (kinglion-frontend)

교대근무자 생활 리듬 설계 서비스의 프론트엔드.
근무표를 읽어 **오늘이 어떤 날인지 판정**하고, 그 날에 맞는 **수면·식사 리듬을 설계**하며, 계획이 바뀌면 **다시 조정**합니다.

> 핵심 컨셉 **"시차"**: 교대근무자는 매주 시차를 건넌다. 실패 판정이 없고, 못 지키는 게 아니라 "건너는" 것.

## 기술 스택

- **React 19** + **TypeScript** + **Vite 8**
- **Tailwind CSS v4** (`@tailwindcss/vite`) — 다크 테마 디자인 토큰은 `src/index.css`의 `@theme`
- **react-router-dom** — 라우팅
- **vite-plugin-pwa** — PWA(설치 가능), 서비스워커 자동 갱신

## 시작하기

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (tsc -b && vite build)
npm run preview  # 빌드 결과 미리보기
npm run lint     # oxlint
```

## 구조

```
src/
  components/layout/   AppLayout(앱 셸) · GNB(하단 탭)
  pages/
    onboarding/        온보딩          (담당: 일하)
    main/              메인페이지       (담당: 일하)
    report/            기록 분석 리포트  (담당: 채원)
    collectbook/       콜렉트북         (담당: 지형, 플레이스홀더)
    mypage/            마이페이지       (담당: 한솔+@, 플레이스홀더)
  constants/modes.ts   7가지 모드 UI 메타데이터
  types/index.ts       도메인 타입 (RoutineResult, ModeKey, TimezoneZone 등)
```

## 컨셉 언어 규칙 (UI 작성 시 준수)

- **시차 언어**(어느 시간대에 사는지, 몇 시간을 건너는지)는 홈 상단 · 주간 예보 · 콜렉트북에서만.
- **오늘의 루틴 · 재설계 화면은 정확한 시각 우선** — 시차 언어 금지.
- **여행 이미지(비행기·캐리어·여권) 배제**, **"실패"라는 단어 사용 금지** (계획이 깨져도 "다시 조정").

## 라우팅 / 온보딩 분기

- 온보딩 미완료(`localStorage: kinglion.onboarded`) → `/onboarding`으로 유도
- 완료 후 `/`(메인)로 이동, 하단 GNB로 각 탭 이동
- 마이페이지의 **새로 시작하기** → 온보딩 초기화 후 재진입

## 모드 (7가지)

`DAY` / `EVENING` / `NIGHT` / `SHIFT_TRANSITION`(근무 전환) / `OFF_RHYTHM_MAINTAIN`(리듬 유지) / `OFF_RHYTHM_SHIFT`(리듬 전환) / `OFF_RECOVERY`(회복)
