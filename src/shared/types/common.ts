/**
 * 서버가 불리언을 실어 보내는 방식 — `"Y"` / `"N"`.
 *
 * 도메인 타입이 아니라 **전송 표현**이다. 그래서 엔티티가 아니라 여기 있다.
 * 예전엔 `asset`·`expense`·`recurring-transaction`·`savingGoal` 네 엔티티가 각자
 * 같은 정의를 들고 있었고, 그 탓에 서로를 타입만 보려고 참조하는 자리가 생겼다.
 */
export type YNType = "Y" | "N";
