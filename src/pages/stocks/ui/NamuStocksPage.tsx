import { useOutletContext } from "react-router-dom";
import { NamuStocksView } from "./NamuStocksView";

/** 나무증권 본문 — 폭만 가른다(768 미만 폰 띠 · 이상 카드). 768 ~ 1279 는 한 칸, 1280 이상은 2 : 1 이다(CSS). */
export function NamuStocksPage({ header }: { header?: React.ReactNode }) {
  const { mobile } = useOutletContext<{ mobile: boolean }>();
  return <NamuStocksView header={header} layout={mobile ? "phone" : "desk"} />;
}
