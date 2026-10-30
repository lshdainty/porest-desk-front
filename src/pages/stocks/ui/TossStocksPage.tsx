import { TossStocksDesktop } from "./TossStocksDesktop";

/** 토스증권 본문 — 폭으로 갈린다(13-1 에서 폰 갈래가 더해진다). */
export function TossStocksPage({ header }: { header?: React.ReactNode }) {
  return <TossStocksDesktop header={header} />;
}
