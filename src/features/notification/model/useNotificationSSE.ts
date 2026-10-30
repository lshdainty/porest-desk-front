import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "@/shared/config";

const API_ROOT = `${import.meta.env.VITE_BASE_URL}${import.meta.env.VITE_API_URL}`;
const SSE_URL = `${API_ROOT}/v1/notifications/stream`;
// EventSource 는 상태 코드를 못 본다 — 끊긴 뒤 다시 잇기 전에 이 주소로 세션이 살아 있는지 한 번 본다
const PROBE_URL = `${API_ROOT}/v1/notifications/unread-count`;

const BASE_DELAY = 1000;
const MAX_DELAY = 30000;
/** 연결이 이만큼 이어져 있어야 재연결 지연을 처음으로 되돌린다(잇자마자 끊기는 연결이 백오프를 지우지 못하게) */
export const STABLE_MS = 30000;

/**
 * 서버 알림 도착(W44) — 띠(토스트)는 띄우지 않고, 받으면 알림 질의만 다시 받아 벨 점이 바뀌게 한다
 * (사용자 결정 I-28 D5 B — migration-shell-notice.md). 셸(AppLayout)이 로그인 뒤 한 번 단다.
 * 인증은 쿠키(withCredentials) — EventSource 가 헤더를 못 보내므로 쿠키로 푼다.
 * 로그아웃은 페이지 전체 이동이라 스트림이 함께 닫히고, 다시 로그인한 셸이 새로 연다.
 * 서버가 연결 상한(5)을 넘겨 이 연결을 밀어내면 REPLACED 를 보내고 닫는다 — 받으면 재연결을 멈춘다
 * (다시 이으면 다음 탭을 밀어내는 순환이 된다). 그 탭이 다시 보이면(visibilitychange) 한 번 새로 잇는다.
 * 세션이 끝난 뒤(401)에는 다시 잇지 않는다. 재연결 지연은 연결이 STABLE_MS 이상 유지된 뒤에만 처음으로 돌아온다.
 */
export const useNotificationSSE = () => {
  const queryClient = useQueryClient();
  const reconnectDelayRef = useRef(BASE_DELAY);
  const hadErrorRef = useRef(false);

  useEffect(() => {
    // active 플래그: cleanup 후 stale 콜백이 재연결하는 것을 방지
    let active = true;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stableTimer: ReturnType<typeof setTimeout> | null = null;

    const clearStable = () => {
      if (stableTimer !== null) {
        clearTimeout(stableTimer);
        stableTimer = null;
      }
    };

    // 세션이 끝났으면 false. 네트워크 오류 · 그 밖의 상태는 계속 잇는다.
    const sessionAlive = async () => {
      try {
        const res = await fetch(PROBE_URL, { credentials: "include" });
        return res.status !== 401;
      } catch {
        return true;
      }
    };

    let replaced = false;

    // 밀려난 탭이 다시 보이면 새로 이어 알림을 받는다. 보일 때 한 번뿐 — 계속 밀려나면 그때 또 멈춘다.
    const onVisible = () => {
      if (!active || !replaced || document.visibilityState !== "visible") return;
      replaced = false;
      hadErrorRef.current = true; // 끊긴 사이 알림을 이어질 때 한 번 맞춘다
      connect();
    };
    document.addEventListener("visibilitychange", onVisible);

    const connect = () => {
      if (!active) return;

      eventSource = new EventSource(SSE_URL, { withCredentials: true });

      eventSource.addEventListener("CONNECT", () => {
        // backoff 는 연결이 STABLE_MS 유지된 뒤에만 초기화 — 잇자마자 끊기는 연결(탭 경합 등)이 지연을 지우지 못한다
        clearStable();
        stableTimer = setTimeout(() => {
          stableTimer = null;
          reconnectDelayRef.current = BASE_DELAY;
        }, STABLE_MS);
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

      eventSource.addEventListener("REPLACED", () => {
        if (!active) return;
        replaced = true;
        clearStable();
        eventSource?.close(); // 닫으면 뒤따르는 onerror 는 오지 않는다
        eventSource = null;
      });

      eventSource.onerror = () => {
        // cleanup이 실행된 후 stale 콜백은 무시. 밀려난 연결의 뒤늦은 오류도 무시
        if (!active || replaced) return;

        clearStable();
        hadErrorRef.current = true;
        console.warn("[SSE] Connection error, reconnecting...");
        eventSource?.close();
        eventSource = null;

        // Exponential backoff 재연결
        reconnectTimer = setTimeout(async () => {
          reconnectTimer = null;
          reconnectDelayRef.current = Math.min(
            reconnectDelayRef.current * 2,
            MAX_DELAY,
          );
          if (!(await sessionAlive())) return; // 401: 로그인 화면으로 가는 중 — 다시 잇지 않는다
          connect(); // connect 가 active 를 다시 확인한다
        }, reconnectDelayRef.current);
      };
    };

    connect();

    return () => {
      // cleanup: active 플래그를 먼저 내려서 이후 콜백 차단
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
      clearStable();
      eventSource?.close();
      eventSource = null;
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };
  }, [queryClient]);
};
