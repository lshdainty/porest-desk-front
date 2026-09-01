import { createContext, useContext } from "react";

/*
 * 테마 컨텍스트와 훅 — 프로바이더 컴포넌트와 갈라 둔다.
 *
 * 한 파일이 컴포넌트와 컴포넌트 아닌 것을 함께 export 하면 Fast Refresh 가 그 파일의
 * 상태를 매번 버린다(react-refresh/only-export-components). 테마는 앱 루트에 한 번
 * 걸리는 값이라 그게 날아가면 개발 중 화면이 통째로 되돌아간다.
 */

export type Theme = "dark" | "light" | "system";

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  resolvedTheme: "light",
};

export const ThemeProviderContext =
  createContext<ThemeProviderState>(initialState);

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
