import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ThemeProviderContext,
  type Theme,
  type ThemeProviderState,
} from "./theme-context";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

const SYSTEM_DARK = "(prefers-color-scheme: dark)";

/** OS 가 지금 다크인가. */
function isSystemDark(): boolean {
  return window.matchMedia(SYSTEM_DARK).matches;
}

/** OS 테마 변경 구독. 모듈 스코프라 참조가 고정된다. */
function subscribeSystemTheme(onChange: () => void): () => void {
  const mq = window.matchMedia(SYSTEM_DARK);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );
  // OS 테마는 리액트 밖의 값이라 `useSyncExternalStore` 로 읽는다. 예전엔 state 로
  // 베껴 두고 effect 두 개(초기 적용 + OS 변경 추적)가 각자 따라갔는데, 같은 DOM
  // 조작이 두 벌로 복사돼 있었고 effect 안 setState 라 렌더를 한 번 더 태웠다.
  const systemDark = useSyncExternalStore(subscribeSystemTheme, isSystemDark);
  const resolvedTheme: "dark" | "light" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  // 실제 적용은 <html> 클래스다 — 파생값이 바뀔 때만 손댄다.
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  const value: ThemeProviderState = {
    theme,
    resolvedTheme,
    setTheme: (t: Theme) => {
      localStorage.setItem(storageKey, t);
      setTheme(t);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
