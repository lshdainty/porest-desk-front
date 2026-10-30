import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "@/shared/config";

const SSE_URL = `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_URL}/v1/notifications/stream`;

/**
 * 서버 알림 도착(W44) — 띠(토스트)는 띄우지 않고, 받으면 알림 질의만 다시 받아 벨 점이 바뀌게 한다
 * (사용자 결정 I-28 D5 B — migration-shell-notice.md). 셸(AppLayout)이 로그인 뒤 한 번 단다.
 * 인증은 쿠키(withCredentials) — EventSource 가 헤더를 못 보내므로 쿠키로 푼다.
 * 로그아웃 · 401 은 페이지 전체 이동이라 스트림이 함께 닫히고, 다시 로그인한 셸이 새로 연다.
 */
export const useNotificationSSE = () => {
  const queryClient = useQueryClient();
  const reconnectDelayRef = useRef(1000);
  const hadErrorRef = useRef(false);

  useEffect(() => {
    // active 플래그: cleanup 후 stale 콜백이 재연결하는 것을 방지
    let active = true;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!active) return;

      eventSource = new EventSource(SSE_URL, { withCredentials: true });

      eventSource.addEventListener("CONNECT", () => {
        reconnectDelayRef.current = 1000; // backoff 초기화
        // 끊긴 사이에 온 알림은 스트림이 다시 보내 주지 않는다 — 다시 이어졌을 때 한 번 맞춘다
        if (hadErrorRef.current) {
          hadErrorRef.current = false;
          queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        }
      });

      // 화면에 쓰는 글은 없다 — 도착했다는 사실만 받아 안 읽은 수(벨 점)를 다시 받는다
      eventSource.addEventListener("NOTIFICATION", () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      });

      eventSource.onerror = () => {
        // cleanup이 실행된 후 stale 콜백은 무시
        if (!active) return;

        hadErrorRef.current = true;
        console.warn("[SSE] Connection error, reconnecting...");
        eventSource?.close();
        eventSource = null;

        // Exponential backoff 재연결
        reconnectTimer = setTimeout(() => {
          reconnectDelayRef.current = Math.min(
            reconnectDelayRef.current * 2,
            30000,
          );
          connect();
        }, reconnectDelayRef.current);
      };
    };

    connect();

    return () => {
      // cleanup: active 플래그를 먼저 내려서 이후 콜백 차단
      active = false;
      eventSource?.close();
      eventSource = null;
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };
  }, [queryClient]);
};
