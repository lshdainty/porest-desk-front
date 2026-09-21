/**
 * 환불을 적을 수 있는 거래인가 — 거래 날짜(로컬 `yyyy-MM-dd`)가 오늘 이하.
 *
 * 환불일은 거래일부터 오늘까지다(D16). 거래일이 오늘보다 뒤인 예정 거래(반복 거래가
 * 미리 만들어 둔 것 등)는 고를 수 있는 환불일이 하나도 없어, 무엇을 보내도 서버가
 * 거절한다. 누르면 거절 토스트만 뜨는 버튼이라 감춘다 — 거래일이 지나면 나타난다.
 *
 * **날짜만 본다.** 오늘 날짜인데 시각만 뒤인 거래는 오늘을 환불일로 받으므로 둔다. 그래서
 * `isScheduledTx`(시각까지 봐서 "아직 안 온 것" 을 가른다)를 쓰지 않는다 — 그걸 쓰면 오늘
 * 저녁 거래의 [환불]이 사라진다.
 *
 * @param expenseDate 거래 일시 `yyyy-MM-ddTHH:mm[:ss]`(로컬 벽시계) 또는 `yyyy-MM-dd`
 * @param todayKey    오늘 `yyyy-MM-dd`(로컬)
 */
export function isRefundableDate(
  expenseDate: string,
  todayKey: string,
): boolean {
  return expenseDate.slice(0, 10) <= todayKey;
}
