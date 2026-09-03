/**
 * 이름 칸 아래 한 줄 — 평소엔 `3/12` 글자수, 문제가 있으면 그 자리에 빨간 안내.
 *
 * 카테고리·라벨·태그가 각자 같은 인라인 마크업을 복제해 쓰고 있었고, 계좌 별칭·저축
 * 목표·프리셋에는 아예 없었다(QA #16·#52·#54·#55). 다섯 번째 복제 대신 여기 하나를
 * 둔다 — 자리를 겸용하는 게 핵심이다. 안내가 카운터 **아래** 붙으면 다이얼로그 높이가
 * 들썩이고, 안내를 안 붙이면 저장 버튼이 안 먹는 것처럼 보인다(#55 가 정확히 그거였다).
 *
 * `len` 은 `trim()` 한 길이를 넘겨라 — 공백만 친 이름이 `0/12` 로 보여야 한다.
 */
export function NameCounter({
  len,
  max,
  err,
}: {
  len: number;
  max: number;
  err?: string | null;
}) {
  return (
    <div
      style={{
        fontSize: "var(--text-badge)",
        color: "var(--fg-tertiary)",
        marginTop: 4,
        textAlign: "right",
      }}
    >
      {err ? (
        <span style={{ color: "var(--fg-expense)" }}>{err}</span>
      ) : (
        <span>
          {len}/{max}
        </span>
      )}
    </div>
  );
}
