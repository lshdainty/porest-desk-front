import { NamuStocksDesktop } from "./NamuStocksDesktop";

/** 나무증권 본문 — 폭으로 갈린다(13-1 에서 폰 갈래가 더해진다). */
export function NamuStocksPage({ header }: { header?: React.ReactNode }) {
  return <NamuStocksDesktop header={header} />;
}
