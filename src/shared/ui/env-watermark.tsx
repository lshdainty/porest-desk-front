/**
 * 개발 환경 워터마크 컴포넌트
 * 운영 도메인이 아닐 때 화면 중앙에 "DEVELOPMENT" 워터마크를 표시합니다.
 */
export const EnvWatermark = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const isProduction = hostname === 'porest.cloud' || hostname === 'www.porest.cloud'

  if (isProduction) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]">
      <span className="text-7xl font-bold text-gray-500/10 select-none tracking-widest">
        DEVELOPMENT
      </span>
    </div>
  )
}
