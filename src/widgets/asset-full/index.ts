export { AssetFullWidget } from "./ui/AssetFullWidget";
// 설정 > 계좌·카드 / 저축 목표 관리 화면. 자산 다이얼로그들과 같은 슬라이스다 —
// 예전엔 features 에 있으면서 이 위젯들을 거꾸로 참조해 순환이 났다.
export { AccountManager } from "./ui/AccountManager";
export { SavingGoalManager } from "./ui/SavingGoalManager";
// 자산 상세('수정')와 관리 화면(폼 열기)이 같은 주소 규칙을 쓴다.
export { ASSET_EDIT_PARAM, editAssetPath } from "./lib/edit-deep-link";
