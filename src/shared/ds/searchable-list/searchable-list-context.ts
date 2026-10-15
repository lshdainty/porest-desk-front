import * as React from "react";

/*
 * Searchable List 의 문맥 — 묶음(SearchableList)이 값 · 검색어 · 강조를 들고, 검색칸 · 결과 · 줄이 읽는다.
 * 컴포넌트 파일은 컴포넌트만 내보낸다(빠른 새로 고침) — 그래서 문맥 · 훅은 여기다.
 */

export type SearchableListPlacement = "sheet" | "inline";
export type SearchableListSize = "large" | "medium" | "responsive";
export type HighlightSource = "keyboard" | "pointer";

export type SearchableListContextValue = {
  value: string | undefined;
  select: (value: string) => void;
  query: string;
  changeQuery: (query: string) => void;
  placement: SearchableListPlacement;
  size: SearchableListSize;
  listboxId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  listboxRef: React.RefObject<HTMLElement | null>;
  highlighted: string | null;
  highlightSource: HighlightSource;
  highlight: (id: string | null, source: HighlightSource) => void;
};

export const SearchableListContext =
  React.createContext<SearchableListContextValue | null>(null);

export function useSearchableList(name: string) {
  const ctx = React.useContext(SearchableListContext);
  if (!ctx) throw new Error(`${name} 는 SearchableList 안에 둔다.`);
  return ctx;
}
