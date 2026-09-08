// 밀려나기 전에 보던 자리로 되돌아오는지(QA #131). 여기서 잠그는 건 "한 번만 쓰인다"
// 와 "앱 밖 주소는 안 받는다" 두 가지다 — 뒤쪽은 편의 기능이 열린 리다이렉트가 되는
// 자리라 특히 그렇다.
import { beforeEach, describe, expect, it } from "vitest";
import { rememberCurrentPath, takeLoginRedirect } from "./login-redirect";

/** 주소창을 옮긴다 — jsdom 은 같은 출처 안에서 replace 를 허용한다. */
const go = (path: string) => window.history.replaceState({}, "", path);

describe("login-redirect", () => {
  beforeEach(() => {
    sessionStorage.clear();
    go("/desk");
  });

  it("적어 둔 자리로 돌아오고, 꺼내면 사라진다", () => {
    go("/desk/memo?tag=3");
    rememberCurrentPath();
    expect(takeLoginRedirect()).toBe("/desk/memo?tag=3");
    // 남겨 두면 다음 로그인이 옛 자리를 물려받는다.
    expect(takeLoginRedirect()).toBeNull();
  });

  it("적어 둔 게 없으면 null — 부르는 쪽이 홈으로 보낸다", () => {
    expect(takeLoginRedirect()).toBeNull();
  });

  it("로그인·콜백 자신은 돌아갈 자리가 아니다", () => {
    go("/login?expired=1");
    rememberCurrentPath();
    expect(takeLoginRedirect()).toBeNull();
    go("/auth/callback?code=x");
    rememberCurrentPath();
    expect(takeLoginRedirect()).toBeNull();
  });

  it("앱 밖 주소는 받지 않는다 — 이 값이 곧 이동 목적지다", () => {
    // `//evil.com` 은 브라우저가 다른 출처로 읽는다. `/` 로 시작하는지만 보면 통과한다.
    sessionStorage.setItem("post_login_redirect", "//evil.com/steal");
    expect(takeLoginRedirect()).toBeNull();
    sessionStorage.setItem("post_login_redirect", "https://evil.com/steal");
    expect(takeLoginRedirect()).toBeNull();
    sessionStorage.setItem("post_login_redirect", "desk/memo");
    expect(takeLoginRedirect()).toBeNull();
  });
});
