/**
 * 자산 편집 폼으로 바로 보내는 딥링크.
 *
 * 자산 상세의 '수정' 은 설정 > 계좌·카드 **목록**으로만 보냈다 — 방금 열어 본 자산을
 * 목록에서 다시 찾아 연필을 눌러야 했다(QA #126). 편집 폼은 그 관리 화면
 * (`AccountManager`)이 하나만 들고 있으므로, 폼을 두 곳에 세우는 대신 **어느 자산을
 * 열지**를 주소로 실어 보낸다.
 *
 * 주소를 만드는 쪽(자산 페이지)과 읽는 쪽(관리 화면)이 문자열을 각자 적으면 한쪽만
 * 고쳐도 조용히 안 열린다 — 그래서 파라미터 이름과 경로를 여기 한 곳에 둔다.
 */

/** 열 자산의 `rowId` 를 싣는 쿼리 파라미터. */
export const ASSET_EDIT_PARAM = "edit";

/** 이 자산의 편집 폼이 열린 채로 관리 화면을 여는 경로. */
export const editAssetPath = (asset: { rowId: number }): string =>
  `/desk/settings?section=accounts&${ASSET_EDIT_PARAM}=${asset.rowId}`;
