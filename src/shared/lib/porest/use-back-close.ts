import { useEffect, useRef } from "react";

/**
 * 모바일 뒤로가기로 대화상자를 닫는다.
 *
 * 시트가 떠 있는데 뒤로가기를 누르면 시트가 아니라 **페이지가 사라졌다**(QA #129).
 * 안드로이드에서 뒤로가기는 "취소" 자리라, 폼을 채우다 한 번 누르면 하던 일이 통째로
 * 날아간다. 앱(Flutter)은 시트가 라우트라 이 동작이 공짜로 나오는데, 웹은 시트가
 * 라우트가 아니어서 직접 넣어야 한다.
 *
 * 방법은 **히스토리에 항목 하나를 쌓는 것**이다. 열릴 때 지금 주소 그대로 한 칸 쌓고,
 * 뒤로가기(`popstate`)가 오면 그게 우리 칸이 사라진 것이므로 닫는다. 버튼·ESC 로 먼저
 * 닫히면 쌓아 둔 칸을 되돌려 놓는다 — 안 그러면 닫은 뒤의 뒤로가기가 한 번 헛돈다.
 *
 * **쌓을 때 `history.state` 를 물려준다.** react-router 는 자기 상태의 `idx` 로 위치를
 * 세는데, 빈 상태로 덮으면 `idx` 가 사라져 그 다음 라우터 이동이 `NaN` 번째가 된다.
 *
 * 데스크톱엔 걸지 않는다 — 거기선 ESC·닫기·바깥 클릭이 이미 있고, 뒤로가기는 "이전
 * 페이지" 라는 뜻이 확고하다. 뒤로 갔다가 앞으로 가면 아무 일도 안 하는 빈 칸이
 * 남는 것도 데스크톱에서만 눈에 띈다.
 *
 * **대화상자 안에서 다른 화면으로 이동하면 우리 칸이 히스토리에 남는다.** 그때는
 * 꼭대기가 아니라 되돌릴 수 없다(되돌리면 사용자가 방금 연 화면을 떠난다). 남은 칸은
 * 주소가 같은 자리라 뒤로가기 한 번이 같은 화면에 머무는 정도로 끝난다 — 이동 중에
 * 엉뚱한 페이지로 튀는 것보다 낫다.
 */

/** 우리 칸임을 알아보는 표식. 값은 그 대화상자의 토큰이다. */
const FLAG = "porestBackClose";

type Entry = { token: number; close: () => void };

/** 겹쳐 열린 대화상자들 — 뒤로가기는 **맨 위 하나만** 닫는다. */
const stack: Entry[] = [];

/**
 * 우리가 스스로 부른 `history.back()` 이 만들 `popstate` 를 세어 둔다.
 *
 * 이게 없으면 위 시트를 버튼으로 닫을 때 나는 `popstate` 가 그 아래 시트까지
 * 닫아 버린다 — 한 번의 닫기로 두 개가 사라진다.
 */
let selfPops = 0;

let bound = false;

function handlePop() {
  if (selfPops > 0) {
    selfPops -= 1;
    return;
  }
  const top = stack.pop();
  top?.close();
}

function bind() {
  if (bound) return;
  bound = true;
  window.addEventListener("popstate", handlePop);
}

let nextToken = 1;

/** 테스트 전용 — 모듈 전역(스택·자가 pop 카운터)을 초기 상태로 되돌린다. */
export function __resetBackCloseForTest(): void {
  stack.length = 0;
  selfPops = 0;
}

/**
 * @param onClose 뒤로가기가 왔을 때 부를 닫기 함수
 * @param enabled 모바일에서만 켠다. 끄면 아무것도 쌓지 않는다.
 */
export function useBackClose(onClose: () => void, enabled: boolean): void {
  // 닫기 함수는 렌더마다 새로 만들어진다 — 최신 것을 참조로 들고, 아래 effect 는
  // `enabled` 가 바뀔 때만 다시 돈다(매 렌더 쌓았다 지우면 히스토리가 요동친다).
  // 대입을 effect 로 미루는 건 렌더 중 ref 쓰기를 피하려는 것이다(순수성 규칙 ·
  // React Compiler). 뒤로가기는 렌더 뒤에나 오므로 한 틱 늦어도 문제가 없다.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!enabled) return;
    const token = nextToken++;
    bind();
    stack.push({ token, close: () => closeRef.current() });
    window.history.pushState(
      { ...window.history.state, [FLAG]: token },
      "",
      window.location.href,
    );

    return () => {
      const i = stack.findIndex((e) => e.token === token);
      // 이미 없으면 뒤로가기가 우리를 닫은 것이다 — 칸도 함께 사라졌다.
      if (i < 0) return;
      stack.splice(i, 1);
      // 우리 칸이 아직 꼭대기일 때만 되돌린다. 대화상자 안에서 라우터 이동이
      // 일어났다면 꼭대기가 아니므로 건드리지 않는다(엉뚱한 페이지로 돌아간다).
      if (window.history.state?.[FLAG] !== token) return;
      selfPops += 1;
      window.history.back();
    };
  }, [enabled]);
}
