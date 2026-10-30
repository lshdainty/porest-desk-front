import { useOutletContext } from "react-router-dom";
import { TossStocksDesktop } from "./TossStocksDesktop";
import { TossStocksMobile } from "./TossStocksMobile";

/** 토스증권 본문 — 폭으로 가른다(768 미만 폰 · 이상 데스크톱 · 태블릿). */
export function TossStocksPage({
  header,
  initialSelected,
}: {
  header?: React.ReactNode;
  /** 768 이상에서 상세 주소로 들어왔을 때 처음 고를 종목(13-1 다리 — 13-2 가 걷는다) */
  initialSelected?: string;
}) {
  const { mobile } = useOutletContext<{ mobile: boolean }>();
  return mobile ? (
    <TossStocksMobile header={header} />
  ) : (
    <TossStocksDesktop header={header} initialSelected={initialSelected} />
  );
}
