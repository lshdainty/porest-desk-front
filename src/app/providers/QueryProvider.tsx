import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 마운트/리마운트/포커스마다 전 쿼리 재요청되어 요청 폭주 → 60초 신선도로 억제.
      // 폭주를 실제로 막는 건 이 값이다. 아래 포커스 갱신이 켜져 있어도 60초 안에 받은
      // 데이터는 fresh 라 재요청하지 않는다.
      staleTime: 60_000,
      // 탭으로 돌아오면 오래된 것만 다시 받는다.
      //
      // 예전엔 전역으로 껐는데, 그러면 다른 기기(앱)에서 바꾼 내용을 웹이 따라잡을
      // 계기가 사라진다 — 탭을 열어 둔 채 앱에서 지출을 넣으면 새로고침 전까지
      // 모른다. 폭주의 원인은 staleTime 0 이었고 그건 위에서 잡았다.
      //
      // 포커스로 갱신하면 안 되는 것들은 개별로 꺼져 있다(주식 시세는 자체 폴링,
      // 사용자 환경설정은 바뀔 일이 드물다).
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
