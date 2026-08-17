# 시차 · 디자인 시스템 (design.md)

팀 작업 시 **디자인 통일성**을 위한 참고 문서. 실제 코드([src/index.css](src/index.css) 토큰 + 컴포넌트 패턴)를 기준으로 정리했으며, 값이 바뀌면 이 문서도 함께 갱신한다.

## 0. 원칙

- **다크 테마 기본** (라이트 없음). 모든 색은 어두운 배경 위 기준.
- **모바일 우선** 반응형. 데스크톱은 모바일 디자인을 유지한 채 폭만 확장.
- **글래스(glassmorphism)** 언어: 반투명 표면 + `backdrop-blur` + 얇은 흰 테두리.
- **시차 컨셉**: "밤을 건너는 몸 상태"의 은유. **여행 이미지(비행기·캐리어·여권) 배제**, **"실패" 표현 금지**(계획이 깨져도 "다시 조정").
- 폰트는 **Pretendard**, 아이콘은 **lucide-react**.

---

## 1. 색상

### 1-1. 코어 토큰 (`@theme`, [src/index.css](src/index.css))

| 역할 | 토큰 | HEX |
| --- | --- | --- |
| 배경 | `--color-bg` | `#0b1020` |
| 표면 | `--color-surface` | `#131a2e` |
| 표면2 | `--color-surface-2` | `#1b2440` |
| 테두리 | `--color-border` | `#2a3450` |
| 텍스트(기본) | `--color-ink` | `#eef2ff` |
| 텍스트(보조) | `--color-ink-muted` | `#9aa6c7` |
| 텍스트(흐림) | `--color-ink-faint` | `#64708f` |
| 브랜드 강조 | `--color-brand` | `#6ea8ff` |
| 브랜드 소프트 | `--color-brand-soft` | `#2b3d63` |

> ⚠️ 브랜드 색은 반드시 `--color-brand`를 쓴다. shadcn의 `--color-accent`(`#1b2440`)와 이름이 겹치면 안 됨(과거 GNB 활성색 오류 원인).

### 1-2. 모드 라벨 색상 (7종)

| 모드 | 토큰 | HEX |
| --- | --- | --- |
| 데이(주간) | `--color-mode-day` | `#f4b942` |
| 이브닝 | `--color-mode-evening` | `#f0703c` |
| 나이트(야간) | `--color-mode-night` | `#5b6cff` |
| 근무 전환 | `--color-mode-shift` | `#b06cff` |
| 휴무·리듬 유지 | `--color-mode-maintain` | `#3fb6a8` |
| 휴무·리듬 전환 | `--color-mode-shift-off` | `#ff8fb0` |
| 휴무·회복 | `--color-mode-recovery` | `#56c46b` |

### 1-3. 액센트 / 그래픽 팔레트 (화면별 인라인 사용)

| 색 | HEX | 쓰는 곳 |
| --- | --- | --- |
| 시안 | `#00F7EF` | 홈 링크·무월 게이지·강조 포인트 |
| 퍼플 | `#B500F7` | 홈·Quick Return 배너·게이지 |
| 석양 옐로 | `#FFE124` | 스플래시 하단 |
| 석양 레드 | `#F71C00` | 스플래시 |
| DAY 그린(교대) | `#ABFF24` | 온보딩 AI결과 달력 점·DAY 강조 |
| NIGHT 블루(교대) | `#1000F7` | 온보딩 AI결과 달력 점·NIGHT 강조 |

### 1-4. 중립(뉴트럴) — 카드/폼 인라인 값

| 용도 | 값 |
| --- | --- |
| 카드 채우기 | `#111111` @ **25~30%** |
| 카드/입력 라벨 | `#888888` |
| 슬라이더 채움·썸 | `#D9D9D9` |
| 세그먼트 토글 활성 | `#555555` @ **20%** (+ 유리) |
| 리포트 보조 텍스트 | `#8792ab` |
| 일반 테두리 | `white / 10%` |

---

## 2. 타이포그래피

- **폰트**: `Pretendard` (Thin 100 ~ Black 900), 폴백 `system-ui`. CDN 로드([index.html](index.html)).
- 숫자·시각은 `tabular-nums`.

| 용도 | 크기 / 굵기 / 자간 |
| --- | --- |
| 스플래시 타이틀 "시차" | 50px · **Thin(100)** · -1% |
| 스플래시 서브카피 | 14px · Thin(100) · -1% |
| 카드 값 ("2시간" 등) | 17px · **Regular(400)** · -5% |
| 화면 타이틀 | `text-xl`(20px) · Bold |
| 본문 | `text-sm`(14px) |
| 라벨/보조 | `text-xs`(12px) · `#888888` 또는 muted |

---

## 3. 반경 · 간격

| 토큰 | 값 |
| --- | --- |
| `rounded-sm` | 8px |
| `rounded-md` | 10px |
| `rounded-lg` | **12px** (카드 기본) |
| `rounded-xl` | 16px |
| `rounded-2xl` | 16px(Tailwind 기본) — 큰 카드/시트 |
| `--radius-card` | 18px |

- 화면 좌우 패딩: `px-5` ~ `px-6`, 상단 `pt-14`, 하단(플로팅 GNB 여백) `pb-28`.

---

## 4. 화면별 배경 그라데이션

각 화면의 정체성 색. 값은 [StepShell.tsx](src/pages/onboarding/components/StepShell.tsx) · [MainPage.tsx](src/pages/main/MainPage.tsx) · [ReportPage.tsx](src/pages/report/ReportPage.tsx) 기준.

| 화면 | 성격 | 개요 |
| --- | --- | --- |
| 스플래시 | 하단 원형 석양(옐로→레드) | 위 다크 / 아래 원형 발광 |
| 개인화 입력 | 하단 원형 주황 글로우 | 다크 마룬 + 하단 앰버 |
| 근무표 등록/업로드 | 하단 원형 **초록** 글로우 | 네이비 + 하단 그린 |
| AI 분석 결과 | **초록(위)** → 네이비(아래) | 상단 그린 글로우 |
| 홈(메인) | **보라(위) → 청록(아래)** | `linear-gradient(160deg, #4a1a6e, #2f2578, #14495f, #0d5346)` |
| 기록 리포트 | 잔잔한 다크 블루 | `linear-gradient(160deg, #16203c, #0f1830, #0c1424)` |

> 공통 패턴: **다크 base(linear) + 포인트 색 원형 글로우(radial)**. 원형 발광은 화면 아래(또는 위) 절반에 담기게.

---

## 5. 컴포넌트 패턴

### 글래스 카드
```
rounded-lg  border border-white/10  bg-[#111111]/25~30  backdrop-blur-md
```

### 기본 CTA (글래스 버튼)
```
h-12 rounded-2xl  border border-white/20  bg-white/10  text-white
backdrop-blur-sm  hover:bg-white/15
```
- **파란 primary 버튼은 쓰지 않는다.** 강조 액션도 글래스 톤으로 통일.
- 보조 액션 hover는 배경 강조 대신 **글자 굵게**(`hover:font-bold`)도 사용(예: "다시 불러오기").

### 세그먼트 토글 (Yes/No, 리듬 선호경향, 체크인 옵션)
```
활성:  bg-[#555555]/20  text-white  backdrop-blur-md   (유리)
비활성: bg-black/20  text-[#888888]
```

### 슬라이더
```
트랙: 선형 그라데이션(밝은 회색→어둠)   채움/썸: #D9D9D9   높이 8px
```

### 바텀 시트
- **radix `sheet`(side="bottom")** 사용. (vaul drawer는 React 19에서 닫힘 후 오버레이 잔류 이슈 → 사용 금지)
- 애니메이션은 **transition 기반**(`transition-transform`, `data-[state=closed]:translate-y-full`).

### 무월 게이지 (홈)
- SVG 원형 링, `#00F7EF → #B500F7` 그라데이션 스트로크. 로드 시 `stroke-dashoffset` 트랜지션으로 채워짐.

### GNB
- 하단 **플로팅 알약** + lucide 아이콘(Home / ClipboardList / BookMarked / User).
- 활성 아이콘: `--color-brand`(#6ea8ff) + `bg-white/8`.

---

## 6. 아이콘

- **lucide-react** 통일. 굵기 `strokeWidth={2}`, 크기 `size-4`~`size-5`.
- 여행 관련 아이콘(비행기·캐리어 등) 사용 금지(컨셉 규칙).

---

## 7. 컨셉 언어 규칙 (UI 카피)

- **시차 언어**("어느 시간대에 사는지", "몇 시간을 건너는지")는 **홈 상단 · 주간 예보 · 콜렉트북**에서만.
- **오늘의 루틴 · 재설계 화면은 정확한 시각 우선** — 시차 언어 금지.
- **"실패" 단어 금지.** 계획이 깨져도 "다시 조정".
- 여행 이미지 전면 배제.

---

## 8. 참고

- shadcn/ui 토큰은 시차 팔레트에 맞춰 `:root`에 다크값으로 매핑([index.css](src/index.css) 44~88줄). shadcn 컴포넌트의 `bg-primary/bg-accent` 등은 이 매핑을 따른다.
- 값 변경 시 이 문서를 **함께 갱신**할 것.
