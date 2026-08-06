import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HidePageKey } from '@/shared/lib/porest/hide-amounts-cards'

/**
 * 화면의 눈(👁) 버튼 → 금액 숨기기 설정으로 보낸다.
 *
 * <p>예전엔 그 자리에서 전체를 켜고 껐다. 이제 가리는 단위가 카드라 버튼 하나로는
 * 무엇을 가릴지 정할 수 없다 — 고르는 화면으로 데려가는 게 맞다.
 *
 * <p>어느 화면에서 눌렀는지 `page` 로 넘겨 그 묶음을 짚어 준다. 34개 목록 앞에서
 * 자기가 보던 카드를 다시 찾게 만들지 않는다.
 */
export function useOpenHideAmountsSettings(_page?: HidePageKey) {
  const navigate = useNavigate()
  // 금액 가리기는 표시 설정 안의 아코디언이다 — hide=1 이면 펼친 채로 열린다.
  return useCallback(() => {
    navigate('/desk/settings?section=appearance&hide=1')
  }, [navigate])
}
