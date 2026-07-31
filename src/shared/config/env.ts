export const config = {
  appTitle: 'POREST Desk',
  apiBaseUrl: `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_URL}`,
  ssoUrl: import.meta.env.VITE_SSO_URL || '',
  // 배포 환경 — Jenkins 가 <env>.env 를 .env.production 으로 복사해 빌드하므로 빌드 시점에 확정된다.
  // 운영만 'prod'. 값이 없으면(로컬·구버전 env) 운영이 아닌 것으로 본다 — 안전한 기본값(워터마크 표시).
  isProd: import.meta.env.VITE_ENV === 'prod',
} as const
