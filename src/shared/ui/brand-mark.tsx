/**
 * 브랜드 마크(rect 4단 나무) — `porest-desk-mark.svg` 미러.
 * 인라인 svg + fg-brand 토큰이라 다크에서 자동으로 밝은 색(primary-light) 전환.
 * 사용처: 로그인, 사이드바 접힘 헤더. (img 자산은 색 고정이라 다크 전환 불가 — 이걸 사용)
 */
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="var(--fg-brand)" aria-hidden>
      <rect x="39" y="18" width="22" height="12" rx="6" />
      <rect x="30" y="36" width="40" height="12" rx="6" />
      <rect x="21" y="54" width="58" height="12" rx="6" />
      <rect x="44.5" y="72" width="11" height="10" rx="5" />
    </svg>
  )
}
