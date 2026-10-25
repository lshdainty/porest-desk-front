import { useOutletContext } from "react-router-dom";
import { StatsDesktop } from "./StatsDesktop";
import { StatsMobile } from "./StatsMobile";

type OutletCtx = { mobile: boolean };

/** 통계 — 폰(띠 구역) · 데스크톱(카드) 두 파일을 고른다(I-08 3). 질의 · 계산은 stats-model, 구역은 stats-parts 등 */
export const StatsPage = () => {
  const { mobile } = useOutletContext<OutletCtx>();
  return mobile ? <StatsMobile /> : <StatsDesktop />;
};
