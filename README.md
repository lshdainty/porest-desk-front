<p align="center">
  <img src="https://img.shields.io/badge/POREST_DESK-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="POREST Desk" />
</p>

<h1 align="center">POREST Desk Frontend</h1>

<p align="center">
  <strong>개인 생산성/라이프 로그 관리를 위한 Desk 프론트엔드</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

---

## 소개

**POREST Desk Frontend**는 [POREST](https://github.com/lshdainty/POREST) 서비스의 Desk 프론트엔드입니다.

할 일, 캘린더, 메모, 지출, 자산, 타이머, 그룹 등 생산성 기능 UI를 제공합니다.

> 현재 출시 전(Pre-release) 단계이며 `project/1.0.0` 브랜치 기준으로 개발 중입니다.

---

## 기술 스택

| Category | Technology |
|----------|------------|
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript_5.9-3178C6?style=flat-square&logo=typescript&logoColor=white) |
| **Framework** | ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black) |
| **Build Tool** | ![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white) |
| **Styling** | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) |
| **State Management** | ![React Query](https://img.shields.io/badge/React_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white) ![Zustand](https://img.shields.io/badge/Zustand-000000?style=flat-square) |
| **Routing** | ![React Router](https://img.shields.io/badge/React_Router_7-CA4245?style=flat-square&logo=reactrouter&logoColor=white) |
| **Form** | ![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat-square&logo=reacthookform&logoColor=white) ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white) |
| **Chart** | ![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=flat-square) |
| **DnD** | ![dnd-kit](https://img.shields.io/badge/dnd--kit-EF4444?style=flat-square) |
| **i18n** | ![i18next](https://img.shields.io/badge/i18next-26A69A?style=flat-square&logo=i18next&logoColor=white) |

---

## 프로젝트 구조

```text
src/
├── app/                 # 앱 초기화, 라우터, Provider
├── entities/            # 도메인 엔티티 API/모델
├── features/            # 기능 단위 모듈 (todo, calendar, expense 등)
├── pages/               # 라우트 페이지
├── shared/              # 공용 API/설정/훅/UI/유틸
├── widgets/             # 화면 조합 위젯 (dashboard, sidebar, mini/full widgets)
├── locales/             # 다국어 리소스 (ko, en)
├── main.tsx             # 엔트리포인트
└── index.css            # 전역 스타일
```

---

## 시작하기

### 요구사항

- **Node.js**: 18+
- **npm**: 9+ (또는 yarn, pnpm)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드된 앱 프리뷰
npm run preview

# 린트 검사
npm run lint

# 다국어 파일 생성
npm run i18n:generate
```

기본 포트: `3002`

### 환경 변수

```bash
# .env.local
VITE_BASE_URL=http://localhost:8002
VITE_API_URL=/api/v1
VITE_SSO_URL=http://localhost:3001
```

앱은 `VITE_BASE_URL + VITE_API_URL` 조합으로 API 주소를 구성합니다.

---

## 주요 화면

- `dashboard`
- `todo`
- `calendar`
- `expense`
- `memo`
- `asset`
- `album`
- `dutch-pay`
- `timer`
- `calculator`
- `group`
- `login`
- `auth-callback`

---

## 관련 저장소

| Repository | Description |
|------------|-------------|
| [POREST](https://github.com/lshdainty/POREST) | 통합 레포지토리 (서비스 소개) |
| [porest-desk-back](https://github.com/lshdainty/porest-desk-back) | Desk 백엔드 |
| [porest-core](https://github.com/lshdainty/porest-core) | 공통 라이브러리 |
| [porest-sso-back](https://github.com/lshdainty/porest-sso-back) | SSO 백엔드 |
| [porest-sso-front](https://github.com/lshdainty/porest-sso-front) | SSO 프론트엔드 |

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/lshdainty">lshdainty</a>
</p>
