/**
 * 정산 만들기 2단계 — 이름을 하나 받았을 때 무엇을 할지 정한다.
 *
 * 종전 `addName` 은 "이미 아는 이름이면 입력만 지우고 return" 이었다. 그래서 친구
 * 목록에 있는 이름을 치면 **아무 일도 일어나지 않았고**(선택 상태를 안 켰다), 사용자는
 * 6명을 넣었다고 믿은 채 4명으로 정산이 저장돼 1인당 금액이 달라졌다(QA #42, 높음).
 * 같은 return 이 "같은 이름 두 번" 도 말없이 삼켰다(QA #39).
 *
 * 갈림길이 넷이라 화면 안 함수로 두면 어느 갈래가 살아 있는지 확인할 방법이 없다 —
 * 판정만 순수 함수로 떼어 낸다. 화면은 결과를 받아 상태를 바꾸고 문구를 고르기만 한다.
 */
export type AddOutcome =
  /** 처음 보는 이름 — 후보에 넣고 선택한다. */
  | { kind: "added"; name: string }
  /** 이미 아는 이름(친구·앞서 추가)인데 아직 안 골랐다 — 그 자리를 켠다. */
  | { kind: "selected"; name: string }
  /** 이미 참여자다 — 안내만 한다(다시 지우면 토글처럼 빠진다). */
  | { kind: "already"; name: string }
  /** '나' 는 항상 참여자라 더할 게 없다. */
  | { kind: "isMe" }
  /** 빈 입력 — 아무 말 없이 넘긴다. */
  | { kind: "empty" };

/**
 * @param raw     입력칸 원문(공백 포함)
 * @param candidates 화면에 줄로 그려진 후보 이름들(친구 + 앞서 추가한 이름)
 * @param picked  지금 선택된 이름 집합
 * @param myName  '나' 에 해당하는 이름
 */
export function resolveAddParticipant(
  raw: string,
  candidates: readonly string[],
  picked: ReadonlySet<string>,
  myName: string,
): AddOutcome {
  const name = raw.trim();
  if (!name) return { kind: "empty" };
  if (name === myName) return { kind: "isMe" };
  if (candidates.includes(name)) {
    return picked.has(name)
      ? { kind: "already", name }
      : { kind: "selected", name };
  }
  return { kind: "added", name };
}

/**
 * 균등 분배 — 몫은 내림, 나머지는 첫 참여자(=나)가 짊어진다.
 *
 * 10,000원 3명이면 3,334 · 3,333 · 3,333 이고 합이 정확히 총액이다(QA #43 이 이
 * 계산의 회귀 기준이다). #42 로 참여자 수가 달라지므로 계산 자체를 고정해 둔다.
 */
export function splitEqually(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) =>
    i === 0 ? base + remainder : base,
  );
}
