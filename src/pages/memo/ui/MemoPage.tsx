import { Fragment, useMemo, useState } from "react";
import { Spinner } from "@/shared/ui/spinner";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Pencil,
  Pin,
  Plus,
  Search,
  Trash2,
  X,
  StickyNote,
  SearchX,
} from "lucide-react";
import {
  useMemos,
  useCreateMemo,
  useUpdateMemo,
  useToggleMemoPin,
  useDeleteMemo,
} from "@/features/memo";
import type { Memo, MemoFormValues } from "@/entities/memo";
import { parseServerUtc } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { SwipeActions } from "@/shared/ui/swipe-actions";
import {
  LedgerDivider,
  LedgerRow,
  LedgerRowMain,
  LedgerRowSep,
  LedgerRowSub,
  LedgerRowTitle,
} from "@/shared/ui/porest/ledger";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Field, FieldLabel } from "@/shared/ui/field";
import { ColorSwatchGroup } from "@/shared/ui/color-swatch";
import { ConfirmDialog, ModalShell } from "@/shared/ui/porest/dialogs";
import { ModalFooter, ModalViewFooter } from "@/shared/ui/porest/modal-footer";
import { MANAGER_LAYOUT } from "@/shared/ui/porest/manager-layout";
import { MobileBackHeader } from "@/shared/ui/porest/mobile-back-header";
import { Skeleton as SkeletonBase } from "@/shared/ui/skeleton";
import { CAT_PALETTE } from "@/shared/lib/porest/chart-palette";

/** 제목·본문 입력 상한 — 서버 `FieldLimits`(TITLE_MAX 200 · CONTENT_MAX 10,000)와 같은 값.
 *  제한이 없어 500자 제목이 서버 500 으로 터지던 자리다(QA #30 · #33). */
const TITLE_MAX = 200;
const CONTENT_MAX = 10_000;

type OutletCtx = { onAddTx: () => void; mobile: boolean };

// 태그 select 옵션 7종 (양 플랫폼 공통 확정). 기본값 '개인'.
const TAG_OPTIONS = [
  "가계부",
  "자산",
  "업무",
  "개인",
  "건강",
  "결제",
  "고정비",
] as const;
const DEFAULT_TAG = "개인";
// 메모 색은 chart palette base hex 저장. null 이면 blue 취급.
const DEFAULT_COLOR = "#2c70bf"; // blue

/*
 * MEMO_COLORS — base hex 키 맵 (양 플랫폼 공통 확정 규칙).
 * - swatch = chart 원색(alias var, 다크 자동 swap)
 * - bg     = color-mix(in oklab, <chart색> 틴트%, var(--bg-surface)) — 카드 배경
 * - fg     = color-mix(in oklab, <chart색> 믹스%, var(--fg-primary)) — 태그 라벨(테마 적응)
 * CAT_PALETTE 의 cssVar alias 를 재사용해 라이트/다크 자동 전환.
 */
type MemoTone = {
  key: string;
  baseHex: string;
  cssVar: string;
  bgPct: number;
  fgPct: number;
};

const MEMO_TONES: MemoTone[] = [
  {
    key: "blue",
    baseHex: "#2c70bf",
    cssVar: "--color-cat-blue",
    bgPct: 12,
    fgPct: 72,
  },
  {
    key: "green",
    baseHex: "#2d8060",
    cssVar: "--color-cat-green",
    bgPct: 14,
    fgPct: 70,
  },
  {
    key: "pink",
    baseHex: "#b83b7a",
    cssVar: "--color-cat-pink",
    bgPct: 12,
    fgPct: 72,
  },
  {
    key: "violet",
    baseHex: "#8b4dba",
    cssVar: "--color-cat-violet",
    bgPct: 12,
    fgPct: 72,
  },
  {
    key: "red",
    baseHex: "#c73838",
    cssVar: "--color-cat-red",
    bgPct: 12,
    fgPct: 72,
  },
  {
    key: "orange",
    baseHex: "#b36418",
    cssVar: "--color-cat-orange",
    bgPct: 13,
    fgPct: 70,
  },
  {
    key: "indigo",
    baseHex: "#5e60c8",
    cssVar: "--color-cat-indigo",
    bgPct: 13,
    fgPct: 72,
  },
  {
    key: "yellow",
    baseHex: "#8c7400",
    cssVar: "--color-cat-yellow",
    bgPct: 16,
    fgPct: 64,
  },
  {
    key: "brown",
    baseHex: "#9a6536",
    cssVar: "--color-cat-brown",
    bgPct: 14,
    fgPct: 68,
  },
  {
    key: "gray",
    baseHex: "#6b7484",
    cssVar: "--color-cat-gray",
    bgPct: 16,
    fgPct: 60,
  },
];

const TONE_BY_HEX = new Map(
  MEMO_TONES.map((t) => [t.baseHex.toLowerCase(), t]),
);

type ResolvedTone = { swatch: string; bg: string; fg: string };

/** base hex → { swatch, bg, fg }. null/미지정/미정의 hex 는 blue fallback. */
function resolveTone(color: string | null | undefined): ResolvedTone {
  const tone =
    (color && TONE_BY_HEX.get(color.toLowerCase())) || MEMO_TONES[0]!;
  const v = `var(${tone.cssVar})`;
  return {
    swatch: v,
    bg: `color-mix(in oklab, ${v} ${tone.bgPct}%, var(--bg-surface))`,
    fg: `color-mix(in oklab, ${v} ${tone.fgPct}%, var(--fg-primary))`,
  };
}

/** modifyAt('YYYY-MM-DD HH:MM[:SS]' 또는 ISO) → 'MM/DD · HH:MM'. */
/**
 * 메모가 리스트·상세·삭제 확인창에서 불릴 이름.
 *
 * 편집기가 빈 제목을 막지만(`save()` 의 `title.trim()` 검사) 서버에 이미 빈 것이
 * 있으면 화면이 빈칸으로 뜬다 — 삭제 확인창에서는 `"" 메모를 삭제할까요?` 가 된다.
 * 그때 뭐라고 부를지를 한 군데서 정한다. 앱 `memo_screen.dart` 의 `hasTitle` 과 같은 규칙.
 */
const memoLabel = (title: string, t: (k: string) => string) =>
  title || t("untitled");

/**
 * 리스트·상세의 수정 시각 도장 — 'MM/DD · HH:MM'.
 *
 * modifyAt 은 서버가 시간대 없이 주는 `[UTC]` 라 문자열을 그대로 자르면 KST(+9)에서
 * 9시간 이른 시각이(자정 근처면 전날 날짜까지) 찍힌다. 그래서 파싱해 로컬로 옮긴다.
 * 못 읽는 값은 예전처럼 빈 문자열 — 도장이 없는 게 틀린 시각보다 낫다.
 */
function formatStamp(iso: string): string {
  const d = parseServerUtc(iso);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SectionLabel({
  icon,
  label,
}: {
  icon: "pin" | "note";
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontWeight: "700",
        color: "var(--fg-tertiary)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: 4,
      }}
    >
      {icon === "pin" ? <Pin size={12} /> : <StickyNote size={12} />}
      {label}
    </div>
  );
}

/** MemoPage 진입 시 사용하는 useQuery 의 isLoading 집계. */
function useMemoPageData() {
  const memosQ = useMemos();
  return { isLoading: memosQ.isLoading };
}

/**
 * 정적 검색 바 — 로딩 스켈레톤과 로드 완료 화면이 공용하는 SoT.
 * 검색바는 데이터에 의존하지 않는 정적 UI 틀이므로 로딩 중에도 실제 렌더한다.
 * (header/매니저 검색과 동일 Input search 톤 · MANAGER_LAYOUT 정합)
 */
function MemoSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation("memo");
  return (
    <div style={MANAGER_LAYOUT.searchWrapStyle}>
      <Search size={14} style={MANAGER_LAYOUT.searchIconStyle} />
      <Input
        search
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("search")}
        aria-label={t("search")}
        className="w-full min-w-0 pl-9 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("clearSearch")}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: 0,
            background: "transparent",
            color: "var(--fg-tertiary)",
            cursor: "pointer",
            padding: 2,
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export const MemoPage = () => {
  const { mobile } = useOutletContext<OutletCtx>();
  const { isLoading } = useMemoPageData();
  if (isLoading) return <MemoPageSkeleton mobile={mobile} />;
  return <MemoPageInner mobile={mobile} />;
};

const MemoPageInner = ({ mobile }: { mobile: boolean }) => {
  const { t } = useTranslation("memo");
  const { t: tc } = useTranslation("common");
  const memosQ = useMemos();
  const createMemo = useCreateMemo();
  const updateMemo = useUpdateMemo();
  const togglePin = useToggleMemoPin();
  const deleteMemo = useDeleteMemo();

  const memos: Memo[] = useMemo(() => memosQ.data ?? [], [memosQ.data]);

  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  // editing: Memo(기존 편집) | { _new: true }(신규) | null(닫힘)
  const [editing, setEditing] = useState<Memo | { _new: true } | null>(null);
  // viewing: 카드 클릭 → 읽기 전용 상세 (수정 버튼으로 editing 전환)
  const [viewing, setViewing] = useState<Memo | null>(null);

  // 태그 칩: '전체' + 데이터에 존재하는 태그(카운트는 항상 전체 기준).
  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const memo of memos) {
      const t = memo.tag || DEFAULT_TAG;
      m.set(t, (m.get(t) ?? 0) + 1);
    }
    return m;
  }, [memos]);

  // 정렬·필터: 검색 + 태그 → 핀 우선 → modifyAt desc.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return memos
      .filter((m) => {
        if (tagFilter !== "all" && (m.tag || DEFAULT_TAG) !== tagFilter)
          return false;
        if (q) {
          const hay = `${m.title}\n${m.content ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return (b.modifyAt || "").localeCompare(a.modifyAt || "");
      });
  }, [memos, query, tagFilter]);

  const pinned = filtered.filter((m) => m.isPinned);
  const others = filtered.filter((m) => !m.isPinned);

  const onSave = (values: MemoFormValues, id?: number) => {
    if (id != null)
      updateMemo.mutate(
        { id, data: values },
        { onSuccess: () => setEditing(null) },
      );
    else createMemo.mutate(values, { onSuccess: () => setEditing(null) });
  };

  const AddBtn = (
    <Button size="sm" onClick={() => setEditing({ _new: true })}>
      <Plus size={14} /> {t("newMemo")}
    </Button>
  );

  // ── 검색 바 — 정적 프레임이라 로딩 스켈레톤과 공용(MemoSearchBar, SoT 단일화)
  const SearchCard = <MemoSearchBar value={query} onChange={setQuery} />;

  // ── 태그 칩 (단일선택 리스트 필터 — Tabs pills sm) ──
  const TagChips = (
    <Tabs
      value={tagFilter}
      onValueChange={(v) => v && setTagFilter(v)}
      style={{ display: "flex", flexWrap: "wrap" }}
    >
      <TabsList variant="pills" size="sm" style={{ flexWrap: "wrap", gap: 6 }}>
        <TabsTrigger variant="pills" size="sm" value="all">
          {t("all")}
          <span
            style={{
              opacity: tagFilter === "all" ? 0.85 : 0.55,
              marginLeft: 2,
            }}
          >
            {memos.length}
          </span>
        </TabsTrigger>
        {[...tagCounts.entries()].map(([tag, count]) => {
          const active = tagFilter === tag;
          return (
            <TabsTrigger key={tag} variant="pills" size="sm" value={tag}>
              {tag}
              <span style={{ opacity: active ? 0.85 : 0.55, marginLeft: 2 }}>
                {count}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );

  // ── 메모 카드 ──
  const MemoCard = (m: Memo) => {
    const tone = resolveTone(m.color);
    const tag = m.tag || DEFAULT_TAG;
    return (
      <Card
        key={m.rowId}
        onClick={() => setViewing(m)}
        className="group/memo cursor-pointer transition-[transform,box-shadow] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-md)]"
        style={{
          background: tone.bg,
          // 앱 그리드(mainAxisExtent 168)와 동일한 고정 높이 — 카드 높이 균일.
          height: 168,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: tone.swatch,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "var(--text-badge)",
              fontWeight: "600",
              color: tone.fg,
              letterSpacing: "0.02em",
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {tag}
          </span>
          {/* 핀 마크는 고정 메모에만 — 비고정 카드 노이즈 제거 (고정 설정은 편집 다이얼로그). */}
          {m.isPinned && (
            <button
              type="button"
              aria-label={t("unpin")}
              disabled={togglePin.pendingIds.has(m.rowId)}
              aria-busy={togglePin.pendingIds.has(m.rowId) || undefined}
              onClick={(ev) => {
                ev.stopPropagation();
                togglePin.mutate(m.rowId);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 4,
                border: 0,
                background: "transparent",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {togglePin.pendingIds.has(m.rowId) ? (
                <Spinner size="sm" />
              ) : (
                <Pin
                  size={13}
                  strokeWidth={2.5}
                  style={{ color: tone.swatch }}
                />
              )}
            </button>
          )}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: "var(--fg-primary)",
            letterSpacing: "-0.015em",
            lineHeight: 1.3,
            // 앱(maxLines 1)과 동일 — 제목 1줄 ellipsis.
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {memoLabel(m.title, t)}
        </div>
        {m.content && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--fg-secondary)",
              lineHeight: 1.45,
              whiteSpace: "pre-wrap",
              display: "-webkit-box",
              // 고정 높이 168 안에서 깔끔히 떨어지는 3줄 (앱 렌더링과 동일 분량).
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              flex: 1,
              minHeight: 0,
            }}
          >
            {m.content}
          </div>
        )}
        <div
          style={{
            fontSize: 11,
            color: "var(--fg-tertiary)",
            marginTop: "auto",
          }}
        >
          {formatStamp(m.modifyAt)}
        </div>
      </Card>
    );
  };

  /**
   * 모바일 전용 행 — 스와이프가 성립하려면 세로 리스트여야 한다(spec Migration notes).
   *
   * <p>MemoCard 는 그대로 둔다. 데스크톱과 공용이고, 그 안의 핀 버튼이 데스크톱에서
   * 고정을 해제하는 유일한 경로다(상세 footer 에는 고정 액션이 없다).
   *
   * <p>색은 카드처럼 배경을 물들이지 않고 8px 점 하나로만 남긴다 — 행이 밀릴 때
   * 색면이 통째로 따라 움직이면 트레이보다 행이 먼저 눈에 들어온다.
   */
  const MemoRow = (m: Memo) => {
    const tone = resolveTone(m.color);
    const tag = m.tag || DEFAULT_TAG;
    return (
      <LedgerRow
        key={m.rowId}
        className="rounded-none"
        onClick={() => setViewing(m)}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: tone.swatch,
            flexShrink: 0,
          }}
        />
        <LedgerRowMain as="button">
          <LedgerRowTitle>{memoLabel(m.title, t)}</LedgerRowTitle>
          <LedgerRowSub>
            <span>{tag}</span>
            {m.content && (
              <>
                <LedgerRowSep />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                >
                  {m.content}
                </span>
              </>
            )}
          </LedgerRowSub>
        </LedgerRowMain>
        {/* 고정 표시 전용 — 토글은 스와이프 '고정' 액션이 맡는다(다음 단계). */}
        {m.isPinned && (
          <Pin
            size={13}
            strokeWidth={2.5}
            style={{ color: tone.swatch, flexShrink: 0 }}
          />
        )}
        <span
          style={{ fontSize: 11, color: "var(--fg-tertiary)", flexShrink: 0 }}
        >
          {formatStamp(m.modifyAt)}
        </span>
      </LedgerRow>
    );
  };

  const list = (items: Memo[]) => (
    <div>
      {items.map((m, i) => (
        <Fragment key={m.rowId}>
          {i > 0 && <LedgerDivider inset subtle />}
          {/* 고정/전체 두 섹션이 같은 groupTag 를 쓴다 — 섹션을 넘나들어도 하나만 열린다. */}
          <SwipeActions
            rowId={`memo-${m.rowId}`}
            groupTag="memo-list"
            rowLabel={memoLabel(m.title, t)}
            // 메모는 모바일·데스크톱이 같은 Body 를 쓰는 유일한 화면이다.
            // 렌더 경로는 list/grid 로 갈라 뒀지만 여기서 한 번 더 못박는다.
            enabled={mobile}
            actions={[
              {
                // 슬롯이 48px 이라 "고정 해제"(4자)는 줄바꿈된다 — 스와이프 전용 2글자 라벨.
                label: m.isPinned ? t("swipeUnpin") : t("swipePin"),
                icon: <Pin />,
                kind: "neutral",
                onSelect: () => togglePin.mutateAsync(m.rowId),
              },
              {
                label: tc("edit"),
                icon: <Pencil />,
                kind: "primary",
                onSelect: () => setEditing(m),
              },
              {
                label: tc("delete"),
                icon: <Trash2 />,
                kind: "destructive",
                confirm: {
                  title: t("deleteConfirm.title"),
                  message: t("deleteConfirm.message", {
                    name: memoLabel(m.title, t),
                  }),
                  cancelLabel: t("deleteConfirm.cancel"),
                  loading: deleteMemo.isPending,
                },
                onSelect: () => deleteMemo.mutateAsync(m.rowId),
              },
            ]}
          >
            {MemoRow(m)}
          </SwipeActions>
        </Fragment>
      ))}
    </div>
  );

  const grid = (items: Memo[]) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: mobile
          ? "repeat(2, 1fr)"
          : "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 12,
      }}
    >
      {items.map(MemoCard)}
    </div>
  );

  // ── 빈 상태 (검색 결과 없음 vs 메모 없음) ──
  const Empty = (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: "var(--bg-sunken)",
          color: "var(--fg-tertiary)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        {query ? <SearchX size={24} /> : <StickyNote size={24} />}
      </div>
      <div
        style={{ fontSize: 15, fontWeight: "700", color: "var(--fg-primary)" }}
      >
        {query ? t("noResults") : t("noMemos")}
      </div>
      <div style={{ fontSize: 13, color: "var(--fg-tertiary)", marginTop: 4 }}>
        {query ? t("noResultsHint") : t("noMemosHint")}
      </div>
      {!query && (
        <div style={{ marginTop: 16 }}>
          <Button size="sm" onClick={() => setEditing({ _new: true })}>
            <Plus size={14} /> {t("newMemo")}
          </Button>
        </div>
      )}
    </div>
  );

  const Body =
    filtered.length === 0 ? (
      Empty
    ) : (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: mobile ? 14 : 16,
        }}
      >
        {pinned.length > 0 && (
          <section>
            {/* 앱과 동일 — 모바일에서도 개수 표시. */}
            <SectionLabel icon="pin" label={`${t("pin")} · ${pinned.length}`} />
            {mobile ? list(pinned) : grid(pinned)}
          </section>
        )}
        {others.length > 0 && (
          <section>
            {pinned.length > 0 && (
              <SectionLabel
                icon="note"
                label={`${t("allMemosSection")} · ${others.length}`}
              />
            )}
            {mobile ? list(others) : grid(others)}
          </section>
        )}
      </div>
    );

  const dialog = (
    <>
      {viewing != null && (
        <MemoDetailDialog
          memo={viewing}
          mobile={mobile}
          onClose={() => setViewing(null)}
          onEdit={(mm) => {
            setViewing(null);
            setEditing(mm);
          }}
          onDelete={(id) =>
            deleteMemo.mutate(id, { onSuccess: () => setViewing(null) })
          }
          deleting={deleteMemo.isPending}
        />
      )}
      {editing != null && (
        <MemoEditDialog
          memo={"_new" in editing ? null : editing}
          mobile={mobile}
          onClose={() => setEditing(null)}
          onSave={onSave}
          submitting={createMemo.isPending || updateMemo.isPending}
        />
      )}
    </>
  );

  if (mobile) {
    return (
      <>
        <MobileBackHeader title={t("title")} />
        <div style={{ padding: "16px 24px 96px", position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {SearchCard}
            {/* 칩 행 우측 끝 + 추가 — PresetManager 정렬 토글 행의 accent 추가 버튼 패턴 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              {TagChips}
              <Button
                type="button"
                variant="accent"
                style={{
                  padding: "7px 12px",
                  fontSize: "var(--text-label-sm)",
                  flexShrink: 0,
                }}
                onClick={() => setEditing({ _new: true })}
              >
                <Plus size={14} /> {tc("add")}
              </Button>
            </div>
            {Body}
          </div>
          {/* FAB 제거 — 칩 행 우측 + 추가 버튼이 새 메모 진입점 */}
          {dialog}
        </div>
      </>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <div
        className="page__head"
        style={{ padding: "24px 28px 12px", margin: 0, maxWidth: 1320 }}
      >
        <div>
          <h1>{t("title")}</h1>
          <div className="sub">{t("subtitle")}</div>
        </div>
        <div className="right">{AddBtn}</div>
      </div>
      <div
        style={{
          padding: "0 28px 24px",
          maxWidth: 1320,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "420px 1fr",
            gap: 16,
            alignItems: "center",
          }}
        >
          {SearchCard}
          {TagChips}
        </div>
        {Body}
      </div>
      {dialog}
    </div>
  );
};

// ───────────────────────────── 편집 다이얼로그 ─────────────────────────────

/** 카드 클릭 → 읽기 전용 상세. TxDetailDialog 패턴 미러 (톤 hero + 본문 + 뷰 footer). */
function MemoDetailDialog({
  memo,
  mobile,
  onClose,
  onEdit,
  onDelete,
  deleting,
}: {
  memo: Memo;
  mobile: boolean;
  onClose: () => void;
  onEdit: (memo: Memo) => void;
  onDelete: (id: number) => void;
  deleting?: boolean;
}) {
  const { t } = useTranslation("memo");
  const { t: tc } = useTranslation("common");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const tone = resolveTone(memo.color);
  const tag = memo.tag || DEFAULT_TAG;

  const Footer = (
    <ModalViewFooter
      onDelete={() => setConfirmDelete(true)}
      deleting={deleting}
      onEdit={() => onEdit(memo)}
    />
  );

  return (
    <>
      <ModalShell
        title={t("detailTitle")}
        onClose={onClose}
        size="md"
        footer={Footer}
        mobile={mobile}
      >
        {/* Hero — 메모 카드와 동일 톤 */}
        <div
          style={{
            background: tone.bg,
            borderRadius: "var(--radius-xl)",
            padding: 20,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: tone.swatch,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "var(--text-badge)",
                fontWeight: "600",
                color: tone.fg,
                letterSpacing: "0.02em",
              }}
            >
              {tag}
            </span>
            {memo.isPinned && (
              <span
                style={{
                  marginLeft: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "var(--text-badge)",
                  fontWeight: "600",
                  color: tone.fg,
                }}
              >
                <Pin
                  size={12}
                  strokeWidth={2.5}
                  style={{ color: tone.swatch }}
                />{" "}
                {t("pinned")}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: "var(--text-title-md)",
              fontWeight: "700",
              color: "var(--fg-primary)",
              letterSpacing: "-0.015em",
              lineHeight: 1.3,
              overflowWrap: "anywhere",
            }}
          >
            {memoLabel(memo.title, t)}
          </div>
          <div
            style={{ fontSize: 11, color: "var(--fg-tertiary)", marginTop: 8 }}
          >
            {formatStamp(memo.modifyAt)}
          </div>
        </div>

        {/* 본문 전문 */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 16,
            fontSize: "var(--text-body-sm)",
            lineHeight: 1.6,
            color: memo.content ? "var(--fg-primary)" : "var(--fg-tertiary)",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {memo.content || t("detail.noContent")}
        </div>
      </ModalShell>

      {confirmDelete && (
        <ConfirmDialog
          title={t("deleteConfirm.title")}
          message={t("deleteConfirm.message", {
            name: memoLabel(memo.title, t),
          })}
          confirmLabel={tc("delete")}
          danger
          loading={deleting}
          onCancel={() => !deleting && setConfirmDelete(false)}
          onConfirm={() => onDelete(memo.rowId)}
        />
      )}
    </>
  );
}

function MemoEditDialog({
  memo,
  mobile,
  onClose,
  onSave,
  submitting,
}: {
  memo: Memo | null;
  mobile: boolean;
  onClose: () => void;
  onSave: (values: MemoFormValues, id?: number) => void;
  submitting?: boolean;
}) {
  const { t } = useTranslation("memo");
  const { t: tc } = useTranslation("common");
  const isNew = !memo;
  const [title, setTitle] = useState(memo?.title ?? "");
  const [content, setContent] = useState(memo?.content ?? "");
  const [tag, setTag] = useState(memo?.tag || DEFAULT_TAG);
  const [pinned, setPinned] = useState(memo?.isPinned ?? false);
  const [color, setColor] = useState(memo?.color || DEFAULT_COLOR);
  const [error, setError] = useState(false);

  const save = () => {
    if (!title.trim()) {
      setError(true);
      return;
    }
    onSave(
      {
        title: title.trim(),
        content,
        tag,
        color,
        folderRowId: null,
      },
      memo?.rowId,
    );
  };

  const Footer = (
    <ModalFooter
      onSave={save}
      saveLabel={tc("save")}
      saving={submitting}
      onCancel={onClose}
    />
  );

  return (
    <ModalShell
      title={isNew ? t("newMemo") : t("editMemo")}
      onClose={onClose}
      size="md"
      footer={Footer}
      mobile={mobile}
    >
      <Field style={{ marginBottom: 14 }}>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value.slice(0, TITLE_MAX));
            if (error) setError(false);
          }}
          placeholder={t("titlePlaceholder")}
          aria-invalid={error}
          maxLength={TITLE_MAX}
          autoFocus
        />
        {error && (
          <div
            style={{
              marginTop: 12,
              padding: "8px 12px",
              background: "var(--status-danger-subtle)",
              color: "var(--status-danger-fg)",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
            }}
          >
            {t("titleRequired")}
          </div>
        )}
      </Field>

      <Field style={{ marginBottom: 14 }}>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
          placeholder={t("contentPlaceholder")}
          maxLength={CONTENT_MAX}
          rows={8}
        />
      </Field>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <Field>
          <FieldLabel>{t("tagLabel")}</FieldLabel>
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAG_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>{t("pin")}</FieldLabel>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minHeight: "var(--touch-min, 44px)",
              cursor: "pointer",
            }}
          >
            <Switch checked={pinned} onCheckedChange={setPinned} />
            <span style={{ fontSize: 14, color: "var(--fg-primary)" }}>
              {t("pinToTop")}
            </span>
          </label>
        </Field>
      </div>

      <Field>
        <FieldLabel>{t("colorLabel")}</FieldLabel>
        <ColorSwatchGroup
          columns={5}
          value={color}
          onValueChange={(v) => v && setColor(v)}
          options={CAT_PALETTE.map((p) => ({
            value: p.baseHex,
            bg: p.bg,
            fg: p.color,
            label: `${t("colorLabel")} ${p.baseHex}`,
          }))}
        />
      </Field>
    </ModalShell>
  );
}

// ───────────────────────────── 로딩 스켈레톤 ─────────────────────────────

/** 메모 카드 1장 skeleton — 톤 dot + 태그 + 제목 + 본문 라인 (실카드 168 고정 높이 동일). */
function MemoCardSkeleton() {
  return (
    <Card
      style={{
        height: 168,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <SkeletonBase className="h-2 w-2 rounded-full" />
        <SkeletonBase className="h-3 w-12" />
      </div>
      <SkeletonBase className="h-4 w-4/5" />
      <SkeletonBase className="h-3.5 w-full" />
      <SkeletonBase className="h-3.5 w-11/12" />
      <SkeletonBase className="h-3.5 w-2/3" />
      <SkeletonBase className="h-3 w-20 mt-auto" />
    </Card>
  );
}

/** 모바일 리스트 행 skeleton — 점 + 제목/부제 + 우측 시각. */
function MemoRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-1 -mx-1 py-3">
      <SkeletonBase className="h-2 w-2 rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <SkeletonBase className="h-4 w-2/5 mb-1.5" />
        <SkeletonBase className="h-3 w-3/5" />
      </div>
      <SkeletonBase className="h-3 w-10 shrink-0" />
    </div>
  );
}

/** Memo 페이지 구조 일치 skeleton — 검색카드 + 태그칩 + (모바일)리스트 / (데스크톱)카드 grid. */
function MemoPageSkeleton({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation("memo");
  const { t: tc } = useTranslation("common");
  const Chips = (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBase key={i} className="h-7 w-16 rounded-full" />
      ))}
    </div>
  );
  // 본문만 리스트로 바꾸면 로딩 중엔 2열 168px 카드였다가 데이터가 오는 순간 화면이
  // 통째로 튄다 — 스켈레톤도 같은 모양으로 간다(spec Migration notes).
  const Grid = mobile ? (
    <div>
      {Array.from({ length: 6 }).map((_, i) => (
        <MemoRowSkeleton key={i} />
      ))}
    </div>
  ) : (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 12,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <MemoCardSkeleton key={i} />
      ))}
    </div>
  );

  if (mobile) {
    return (
      <>
        <MobileBackHeader title={t("title")} />
        <div style={{ padding: "16px 24px 96px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* 정적 검색바 — 데이터 무관 UI 틀이라 로딩 중에도 실제 렌더. */}
            <MemoSearchBar value="" onChange={() => {}} />
            {/* 칩 행 우측 끝 + 추가 — 칩 카운트만 스켈레톤, 정적 추가 버튼은 실제 렌더(로딩 중 disabled). */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              {Chips}
              <Button
                type="button"
                variant="accent"
                disabled
                style={{
                  padding: "7px 12px",
                  fontSize: "var(--text-label-sm)",
                  flexShrink: 0,
                }}
              >
                <Plus size={14} /> {tc("add")}
              </Button>
            </div>
            {Grid}
          </div>
        </div>
      </>
    );
  }
  return (
    <div style={{ padding: 0 }}>
      <div
        className="page__head"
        style={{ padding: "24px 28px 12px", margin: 0, maxWidth: 1320 }}
      >
        <div>
          <SkeletonBase className="h-8 w-20 mb-2" />
          <SkeletonBase className="h-4 w-36" />
        </div>
        <div className="right">
          <SkeletonBase className="h-8 w-24 rounded-md" />
        </div>
      </div>
      <div
        style={{
          padding: "0 28px 24px",
          maxWidth: 1320,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "420px 1fr",
            gap: 16,
            alignItems: "center",
          }}
        >
          {/* 정적 검색바 — 데이터 무관 UI 틀이라 로딩 중에도 실제 렌더. */}
          <MemoSearchBar value="" onChange={() => {}} />
          {Chips}
        </div>
        {Grid}
      </div>
    </div>
  );
}
