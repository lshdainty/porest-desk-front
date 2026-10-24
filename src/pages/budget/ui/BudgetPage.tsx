import { useOutletContext } from "react-router-dom";
import { BudgetDesktop } from "./BudgetDesktop";
import { BudgetMobile } from "./BudgetMobile";

type OutletCtx = { mobile: boolean };

/** 예산 — 폰(띠 셋) · 데스크톱(카드) 두 파일을 고른다(I-08 3). 질의 · 계산은 budget-model, 구역은 budget-parts */
export const BudgetPage = () => {
  const { mobile } = useOutletContext<OutletCtx>();
  return mobile ? <BudgetMobile /> : <BudgetDesktop />;
};
