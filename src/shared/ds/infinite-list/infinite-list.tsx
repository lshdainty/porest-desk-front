import * as React from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ds/button";
import { useDsText } from "@/shared/ds/i18n";
import { ProgressCircle } from "@/shared/ds/progress-circle";
import { useWaitPhase } from "@/shared/ds/skeleton";

import {
  INFINITE_LIST_MESSAGE,
  INFINITE_LIST_RETRY,
  INFINITE_LIST_ROOT,
  INFINITE_LIST_TEXT,
  REACH_THRESHOLD,
  scrollParent,
  type InfiniteListStatus,
} from "./infinite-list-variants";

/*
 * Groo Infinite List — 폰(768 미만)의 긴 목록 끝 자리(2026-10-22). 수치 원본은 groo-design specs/components/infinite-list.yaml(값은
 * src/shared/ds/spec/infinite-list.json), 규칙은 specs/components/pagination.md 의 "폰은 끝없이 불러오기"다. 쪽 넘김(Pagination)의 폰 짝이다.
 * groo-design recipes/shadcn/components/ui/pagination.tsx 의 InfiniteListEnd 를 가져왔다 — 글은 ds 로케일 문구(01-043)로 뺐다.
 *
 *   InfiniteListEnd   목록(ul) 바로 다음에 둔다. 위아래 24, 가운데
 *     status      loading · error · end — 지금 목록 끝의 상태
 *       loading   Progress Circle 24 · neutral — 1초가 지나야 보인다(그 전에는 보이지 않게 그려 높이만 지킨다 — skeleton 의 useWaitPhase)
 *       error     "더 불러오지 못했어요."(t4 · 400 · fg-neutral-muted) + 12 아래 Button neutralWeak small "다시 시도" — 이미 받은 줄은 그대로
 *       end       endText(기본 "모두 봤어요." — t4 · 400 · fg-neutral-subtle). 한 쪽으로 끝나는 짧은 목록에는 두지 않는다
 *     onRetry     "다시 시도" — 그 쪽을 다시 받는다
 *     endText     끝 글 — 목록마다 "카드를 모두 봤어요." 처럼
 *     onReachEnd  이 자리가 가장 가까운 스크롤 상자(없으면 화면) 아래 끝에서 300 안으로 오면 부른다 — loading 일 때만
 *
 * 못 불러옴 · 끝 글은 상태 글(role="status")로 한 번 읽힌다. 받는 동안 목록에 aria-busy 를 거는 것은 목록(쓰는 쪽)의 몫이다.
 * onReachEnd — 한 번 부르면 목록이 자라거나(바로 앞 목록 · 부모의 크기가 바뀜) 300 밖으로 나갔다 올 때까지 다시 부르지 않는다 —
 *   받는 동안 거듭 부르지 않게. 못 불러온 뒤 "다시 시도" 로 돌아온 loading 은 다시 시도가 받고 있으니 부르지 않는다.
 *   "더 보기" 버튼은 두지 않는다(폰은 끝없이, 데스크톱은 쪽 넘김). 첫 쪽을 못 불러오면 이 자리가 아니라 목록 자리가 Result Section 의 실패다.
 */
export interface InfiniteListEndProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** loading — 다음 쪽이 있다(받는 중 · 곧 받는다, 원) · error — 못 불러옴(글 + 다시 시도) · end — 끝(글) */
  status: InfiniteListStatus;
  /** "다시 시도" — 그 쪽을 다시 받는다 */
  onRetry?: () => void;
  /** 끝 글 — 기본 "모두 봤어요."(목록마다 "카드를 모두 봤어요." 처럼) */
  endText?: React.ReactNode;
  /** 목록 끝이 화면(스크롤 상자) 아래에서 300 안으로 오면 부른다 — loading 일 때만, 한 번 와서 받는 동안은 다시 부르지 않는다 */
  onReachEnd?: () => void;
}

const InfiniteListEnd = React.forwardRef<HTMLDivElement, InfiniteListEndProps>(
  ({ status, onRetry, endText, onReachEnd, className, ...props }, ref) => {
    const dsT = useDsText();
    const own = React.useRef<HTMLDivElement | null>(null);
    const phase = useWaitPhase(status === "loading");
    const onReachEndRef = React.useRef(onReachEnd);
    React.useEffect(() => {
      onReachEndRef.current = onReachEnd;
    });
    const prevStatusRef = React.useRef<InfiniteListStatus | null>(null);

    React.useEffect(() => {
      const prev = prevStatusRef.current;
      prevStatusRef.current = status;
      const el = own.current;
      if (
        !el ||
        status !== "loading" ||
        typeof IntersectionObserver === "undefined"
      )
        return;
      // 다시 시도로 돌아왔으면 그 요청이 받고 있다 — 목록이 자라거나 나갔다 올 때까지 기다린다
      let armed = prev !== "error";
      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (!entry?.isIntersecting) {
            armed = true;
            return;
          }
          if (!armed) return;
          armed = false;
          onReachEndRef.current?.();
        },
        {
          root: scrollParent(el),
          rootMargin: `0px 0px ${REACH_THRESHOLD}px 0px`,
        },
      );
      io.observe(el);
      // 목록이 자랐다(새 쪽이 붙었다) — 다시 재서 아직 300 안이면 다음 쪽을 부른다. 목록(바로 앞 형제)과 부모의 크기를 본다 —
      // 부모가 높이를 정한 스크롤 상자면 부모의 크기는 그대로라 목록을 따로 본다
      const parent = el.parentElement;
      const list = el.previousElementSibling;
      const size = () =>
        `${parent?.scrollHeight ?? 0}:${list instanceof HTMLElement ? list.offsetHeight : 0}`;
      let lastSize = size();
      const ro =
        typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(() => {
              const now = size();
              if (now === lastSize) return;
              lastSize = now;
              armed = true;
              io.unobserve(el);
              io.observe(el);
            })
          : null;
      if (parent) ro?.observe(parent);
      if (list) ro?.observe(list);
      return () => {
        io.disconnect();
        ro?.disconnect();
      };
    }, [status]);

    return (
      <div
        ref={(node) => {
          own.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        data-slot="infinite-list-end"
        data-status={status}
        className={cn(INFINITE_LIST_ROOT, className)}
        {...props}
      >
        {status === "loading" && (
          <ProgressCircle
            size="24"
            data-slot="infinite-list-end-progress"
            className={phase === "quiet" ? "invisible" : undefined}
          />
        )}
        <div
          role="status"
          data-slot="infinite-list-end-message"
          className={INFINITE_LIST_MESSAGE}
        >
          {status === "error" && (
            <p className={INFINITE_LIST_TEXT.error}>
              {dsT("infiniteList.error")}
            </p>
          )}
          {status === "end" && (
            <p className={INFINITE_LIST_TEXT.end}>
              {endText ?? dsT("infiniteList.end")}
            </p>
          )}
        </div>
        {status === "error" && (
          <Button
            variant="neutralWeak"
            size="small"
            data-slot="infinite-list-end-retry"
            className={INFINITE_LIST_RETRY}
            onClick={() => onRetry?.()}
          >
            {dsT("common.retry")}
          </Button>
        )}
      </div>
    );
  },
);
InfiniteListEnd.displayName = "InfiniteListEnd";

export { InfiniteListEnd };
