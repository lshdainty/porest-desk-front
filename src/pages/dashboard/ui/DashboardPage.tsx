import { useOutletContext } from "react-router-dom";
import type { OutletCtx } from "./home-shared";
import { HomeDesktop } from "./HomeDesktop";
import { HomeMobile } from "./HomeMobile";

/**
 * 홈 — 폰(768 미만)과 데스크톱 · 태블릿을 고르기만 한다. 틀은 처음부터 그리고, 서버 값 자리만 스켈레톤 ·
 * 실패는 그 구역에서(I-06 33) — 화면 전체를 스켈레톤으로 바꾸지 않는다.
 */
export const DashboardPage = () => {
  const { mobile } = useOutletContext<OutletCtx>();
  return mobile ? <HomeMobile /> : <HomeDesktop />;
};
