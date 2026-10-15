import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Avatar } from "@/shared/ds/avatar";
import { Badge } from "@/shared/ds/badge";
import { Button } from "@/shared/ds/button";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
} from "@/shared/ds/bottom-sheet";
import { DemoBlock, DemoRow, Specimen } from "@/shared/ds/catalog/DemoKit";
import { Field } from "@/shared/ds/field";
import { InputButton, useInputButtonSurface } from "@/shared/ds/input-button";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ds/popover";

import {
  SearchableList,
  SearchableListEmpty,
  SearchableListError,
  SearchableListGroup,
  SearchableListInput,
  SearchableListItem,
  SearchableListResults,
  SearchableListSkeleton,
} from "./searchable-list";
import { focusSearchableList, matchesSearch } from "./searchable-list-dom";

// 거르는 것은 쓰는 쪽이다 — 공용 규칙 matchesSearch(NFC · 대소문자 · 공백 무시 · 이름 + 별칭, Q-007-1 C). 한글 초성 검색은 아직 정하지 않았다
const matches = (query: string, ...names: string[]) =>
  matchesSearch(query, ...names);

// 별칭 — 이름 말고 부르는 말("KB" 로도 국민은행이 나온다)
const BANK_ALIASES: Record<string, string[]> = {
  국민은행: ["KB", "KB국민"],
  신한은행: ["Shinhan"],
  우리은행: ["Woori"],
  하나은행: ["KEB", "Hana"],
  카카오뱅크: ["Kakao", "카뱅"],
  토스뱅크: ["Toss"],
  케이뱅크: ["Kbank"],
};

type Bank = { id: string; name: string };
const matchesBank = (b: Bank, query: string) =>
  matches(query, b.name, ...(BANK_ALIASES[b.name] ?? []));
const BANK_GROUPS: { label: string; banks: Bank[] }[] = [
  {
    label: "시중은행",
    banks: ["국민은행", "신한은행", "우리은행", "하나은행", "SC제일은행"].map(
      (name) => ({ id: name, name }),
    ),
  },
  {
    label: "인터넷은행",
    banks: ["카카오뱅크", "토스뱅크", "케이뱅크"].map((name) => ({
      id: name,
      name,
    })),
  },
  {
    label: "지방은행",
    banks: ["부산은행", "대구은행", "광주은행", "전북은행", "제주은행"].map(
      (name) => ({ id: name, name }),
    ),
  },
  {
    label: "저축기관",
    banks: [
      "새마을금고중앙회 전국 지점 통합 계좌 조회 서비스 이용 은행",
      "신협",
      "우체국",
    ].map((name) => ({ id: name, name })),
  },
];

const tone = "bg-chart-blue-weak text-chart-blue";
// 앞 붙이개 자리표시 — Logo Tile 40 · 카드 그림 56 · Avatar 36(스펙 크기). 진짜 부품은 각자의 스펙이 잰다
const Logo = ({ name }: { name: string }) => (
  <span
    className={`grid size-10 place-items-center rounded-r3 text-t5 font-bold ${tone}`}
  >
    {name.slice(0, 1)}
  </span>
);
const CardArt = () => (
  <span className="block aspect-[1.586] w-14 rounded-r2 bg-chart-violet-weak" />
);

type Prefix = "none" | "logo" | "cardArt" | "avatar";
const prefixOf = (prefix: Prefix, name: string) =>
  prefix === "logo" ? (
    <Logo name={name} />
  ) : prefix === "cardArt" ? (
    <CardArt />
  ) : prefix === "avatar" ? (
    <Avatar name={name} size={36} />
  ) : undefined;

// 검사기가 재는 견본 — 크기 · 놓인 자리 · 앞 붙이개 · 고름. 줄은 셋, 첫 줄을 고른 값으로 둔다
function Sample({
  size,
  placement,
  prefix = "none",
  current = true,
  highlighted = false,
  caption,
}: {
  size: "large" | "medium";
  placement: "sheet" | "inline";
  prefix?: Prefix;
  current?: boolean;
  highlighted?: boolean;
  caption: string;
}) {
  const rows = ["신한은행", "국민은행", "카카오뱅크"];
  return (
    <div className="flex w-[360px] flex-col gap-x1">
      <div
        className={`rounded-r3 border border-stroke-neutral-weak pb-x2 ${placement === "sheet" ? "bg-bg-layer-floating" : "bg-bg-layer-default"}`}
      >
        <Specimen
          spec="searchable-list"
          combo={{
            size,
            placement,
            prefix,
            selected: current ? "current" : "other",
          }}
          state={highlighted ? "highlighted" : "enabled"}
        >
          <SearchableList
            size={size}
            placement={placement}
            defaultValue={current ? rows[0] : undefined}
          >
            <SearchableListInput
              autoFocus={false}
              placeholder="은행 이름 검색"
            />
            <SearchableListResults aria-label="은행">
              <SearchableListGroup label="시중은행">
                {rows.map((name, i) => (
                  <SearchableListItem
                    key={name}
                    value={name}
                    title={name}
                    detail={i === 1 ? "계좌 · 카드" : undefined}
                    prefix={prefixOf(prefix, name)}
                    // 견본은 강조한 모습을 고정으로 그린다(직접 짚는 것은 아래 직접 골라 보기에서)
                    {...(highlighted && i === 1
                      ? { "data-highlighted": "keyboard" }
                      : null)}
                  />
                ))}
              </SearchableListGroup>
            </SearchableListResults>
          </SearchableList>
        </Specimen>
      </div>
      <span className="px-x0_5 text-t2 text-fg-neutral-subtle">{caption}</span>
    </div>
  );
}

// ── 직접 골라 보기 ──────────────────────────────────────────

/** 은행 고르기 — Input Button 이 여는 검색 시트(1280 미만) · 팝오버(이상). 고르면 닫힌다 */
function BankPicker() {
  const surface = useInputButtonSurface();
  const [open, setOpen] = useState(false);
  const [bank, setBank] = useState<Bank | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState<HTMLDivElement | null>(null);
  const groups = BANK_GROUPS.map((g) => ({
    ...g,
    banks: g.banks.filter((b) => matchesBank(b, query)),
  })).filter((g) => g.banks.length > 0);
  const trigger = (
    <InputButton
      placeholder="은행 선택"
      value={bank?.name}
      suffixIcon={<ChevronDown />}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => {
        setQuery("");
        setOpen(true);
      }}
    />
  );
  const list = (
    <SearchableList
      value={bank?.id}
      onValueChange={(id) => {
        setBank(BANK_GROUPS.flatMap((g) => g.banks).find((b) => b.id === id));
        setOpen(false);
      }}
      query={query}
      onQueryChange={setQuery}
    >
      <SearchableListInput placeholder="은행 이름 검색" />
      {groups.length === 0 ? (
        <SearchableListEmpty />
      ) : (
        <SearchableListResults aria-label="은행">
          {BANK_GROUPS.map((g) => (
            <SearchableListGroup key={g.label} label={g.label}>
              {g.banks
                .filter((b) => matchesBank(b, query))
                .map((b) => (
                  <SearchableListItem
                    key={b.id}
                    value={b.id}
                    title={b.name}
                    prefix={<Logo name={b.name} />}
                  />
                ))}
            </SearchableListGroup>
          ))}
        </SearchableListResults>
      )}
    </SearchableList>
  );
  return (
    <div className="flex w-[300px] flex-col gap-x2">
      <Field label="은행">
        {surface === "sheet" ? (
          <BottomSheet open={open} onOpenChange={setOpen} container={place}>
            {trigger}
            <BottomSheetContent
              title="은행 선택"
              onOpenAutoFocus={focusSearchableList}
            >
              {/* 본문 좌우 여백을 뺀다 — 검색칸 · 줄이 제 24 를 가진다 */}
              <BottomSheetBody className="px-0">{list}</BottomSheetBody>
            </BottomSheetContent>
          </BottomSheet>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            {place && (
              <PopoverContent
                container={place}
                aria-label="은행 선택"
                align="start"
                onOpenAutoFocus={focusSearchableList}
              >
                <PopoverBody className="px-0">{list}</PopoverBody>
              </PopoverContent>
            )}
          </Popover>
        )}
      </Field>
      <div ref={setPlace} />
    </div>
  );
}

type Card = { id: string; name: string; issuer: string; discontinued: boolean };
const CARDS: Card[] = [
  ["T-Pay 신한카드", "신한카드", false],
  ["삼성 iD ON 카드", "삼성카드", false],
  ["현대카드 ZERO Edition2", "현대카드", false],
  ["KB국민 노리2 체크카드", "KB국민카드", false],
  ["우리카드 7CORE 체크", "우리카드", true],
  ["롯데카드 LOCA 365", "롯데카드", false],
  ["하나카드 1Q 트래블로그", "하나카드", false],
  ["NH농협 올바른 FLEX 카드", "NH농협카드", true],
].map(([name, issuer, discontinued], i) => ({
  id: `c${i}`,
  name: name as string,
  issuer: issuer as string,
  discontinued: discontinued as boolean,
}));

type Result =
  | { status: "pending"; data?: Card[] }
  | { status: "ok"; data: Card[] }
  | { status: "error" };

/** 서버 검색 · 단계 안(inline) — 마지막 입력 뒤 300ms 에 한 번 보낸다. 받는 동안은 옛 결과를 남기고, 처음에는 줄 스켈레톤. 실패는 0건과 따로 */
function ServerSearch() {
  const [query, setQuery] = useState("");
  const [cardId, setCardId] = useState<string | undefined>(undefined);
  const [requests, setRequests] = useState(0);
  const [fail, setFail] = useState(false);
  const [result, setResult] = useState<Result>({ status: "pending" });
  const [retrying, setRetrying] = useState(false);

  const request = (q: string, forceFail = fail) => {
    setRequests((n) => n + 1);
    setResult((r) => ({
      status: "pending",
      data: r.status === "error" ? undefined : r.data,
    }));
    window.setTimeout(() => {
      setRetrying(false);
      setResult(
        forceFail
          ? { status: "error" }
          : {
              status: "ok",
              data: CARDS.filter((c) =>
                matches(q, c.name, c.issuer, `${c.name}${c.issuer}`),
              ),
            },
      );
    }, 700);
  };

  const rows = result.status === "error" ? undefined : result.data;
  return (
    <div className="flex w-[360px] flex-col gap-x3">
      <div className="flex items-center gap-x2 text-t3 text-fg-neutral-subtle">
        <span>서버 요청 {requests}번</span>
        <Button
          size="small"
          variant="neutralWeak"
          onClick={() => {
            setFail(!fail);
          }}
        >
          {fail ? "실패 끄기" : "실패하게 하기"}
        </Button>
        <Button
          size="small"
          variant="neutralWeak"
          onClick={() => request(query)}
        >
          처음 불러오기
        </Button>
      </div>
      <div className="max-h-[420px] overflow-auto rounded-r3 border border-stroke-neutral-weak bg-bg-layer-default pb-x2">
        <SearchableList
          placement="inline"
          value={cardId}
          onValueChange={setCardId}
          query={query}
          onQueryChange={setQuery}
          onSearch={(q) => request(q)}
        >
          <SearchableListInput placeholder="카드 이름 검색" />
          {rows === undefined && result.status === "pending" ? (
            <SearchableListSkeleton prefix="cardArt" />
          ) : result.status === "error" ? (
            <SearchableListError
              retrying={retrying}
              onRetry={() => {
                setRetrying(true);
                request(query);
              }}
            />
          ) : rows && rows.length === 0 ? (
            <SearchableListEmpty description="카드사 이름으로도 찾아보세요." />
          ) : (
            <SearchableListResults aria-label="카드 상품">
              {rows?.map((c) => (
                <SearchableListItem
                  key={c.id}
                  value={c.id}
                  prefix={<CardArt />}
                  title={c.name}
                  detail={
                    <span className="flex items-center gap-x1_5">
                      {c.issuer} · 신용
                      {c.discontinued && (
                        <Badge className="shrink-0">단종</Badge>
                      )}
                    </span>
                  }
                />
              ))}
            </SearchableListResults>
          )}
        </SearchableList>
      </div>
    </div>
  );
}

const MANY = Array.from({ length: 400 }, (_, i) => ({
  id: `s${i}`,
  name:
    i % 37 === 0
      ? `종목 ${String(i + 1).padStart(3, "0")} — 매우 길어서 한 줄에 다 들어가지 않는 이름의 상장지수펀드 레버리지 인버스 2X`
      : `종목 ${String(i + 1).padStart(3, "0")}`,
}));

/** 목록 수백 개 — 스크롤해도 검색칸이 위에 붙는다. 화살표로 끝까지 가도 강조한 줄이 보인다. 한글을 치는 동안(조합 중)의 화살표 · Enter 는 조합의 것이다 */
function ManyItems() {
  const [query, setQuery] = useState("");
  const [value, setValue] = useState<string | undefined>("s123");
  const rows = MANY.filter((r) => matches(query, r.name));
  return (
    <div className="max-h-[420px] w-[360px] overflow-auto rounded-r3 border border-stroke-neutral-weak bg-bg-layer-default pb-x2">
      <SearchableList
        placement="inline"
        value={value}
        onValueChange={setValue}
        query={query}
        onQueryChange={setQuery}
      >
        <SearchableListInput placeholder="종목 이름 검색" />
        {rows.length === 0 ? (
          <SearchableListEmpty />
        ) : (
          <SearchableListResults aria-label="종목">
            {rows.map((r) => (
              <SearchableListItem
                key={r.id}
                value={r.id}
                title={r.name}
                detail="코스피 · 상장지수펀드"
              />
            ))}
          </SearchableListResults>
        )}
      </SearchableList>
    </div>
  );
}

const Surface = ({ children }: { children: React.ReactNode }) => (
  <div className="w-[360px] rounded-r3 border border-stroke-neutral-weak bg-bg-layer-default pb-x2">
    {children}
  </div>
);

/** 카탈로그(/dev/ds) — 크기 × 놓인 자리 × 앞 붙이개 × 고름 · 강조, 0건 · 실패 · 불러오는 줄, 직접 골라 보기 */
export const SearchableListDemo = () => (
  <div className="flex flex-col gap-x8">
    <DemoBlock title="크기 × 놓인 자리 — 검색칸 large 40 · medium 34, 시트(floating 면) · 단계 안(default 면). 첫 줄이 지금 값(오른쪽 라디오 켬)">
      {(["large", "medium"] as const).map((size) => (
        <DemoRow key={size} label={size}>
          {(["sheet", "inline"] as const).map((placement) => (
            <Sample
              key={placement}
              size={size}
              placement={placement}
              caption={`${size} · ${placement}`}
            />
          ))}
        </DemoRow>
      ))}
    </DemoBlock>

    <DemoBlock title="앞 붙이개 · 고름 · 강조 — 로고 타일 40 · 카드 그림 56 · 아바타 36, 고르지 않은 목록, 화살표로 짚은 줄(강조 바탕)">
      <DemoRow label="large · sheet">
        {(["logo", "cardArt", "avatar"] as const).map((prefix) => (
          <Sample
            key={prefix}
            size="large"
            placement="sheet"
            prefix={prefix}
            caption={prefix}
          />
        ))}
        <Sample
          size="large"
          placement="sheet"
          current={false}
          caption="고른 것 없음"
        />
        <Sample
          size="large"
          placement="sheet"
          highlighted
          caption="강조 — 둘째 줄"
        />
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="결과 없음 · 실패 · 불러오는 줄 — 목록 자리에 Result Section(알림). 줄 스켈레톤은 앞 자리 4가지">
      <DemoRow label="0건 · 실패">
        <Surface>
          <SearchableList defaultQuery="나루로리롱">
            <SearchableListInput
              autoFocus={false}
              placeholder="은행 이름 검색"
            />
            <SearchableListEmpty />
          </SearchableList>
        </Surface>
        <Surface>
          <SearchableList>
            <SearchableListInput
              autoFocus={false}
              placeholder="카드 이름 검색"
            />
            <SearchableListError onRetry={() => {}} />
          </SearchableList>
        </Surface>
      </DemoRow>
      <DemoRow label="불러오는 줄">
        {(["logo", "cardArt", "avatar", "none"] as const).map((prefix) => (
          <Surface key={prefix}>
            <SearchableList>
              <SearchableListInput autoFocus={false} placeholder="검색" />
              <SearchableListSkeleton prefix={prefix} rows={3} />
            </SearchableList>
          </Surface>
        ))}
      </DemoRow>
    </DemoBlock>

    <DemoBlock title="직접 골라 본다 — 은행 고르기: 1280 미만은 검색 시트, 이상은 팝오버. 치면 거르고, ↓ ↑ 로 강조, Enter 로 고르고 닫힌다, Esc 는 검색어 → 닫기">
      <BankPicker />
    </DemoBlock>

    <DemoBlock title="서버 검색(단계 안) — 글자를 쳐도 마지막 입력 뒤 300ms 에 한 번만 보낸다. 옛 결과는 남기고, 실패는 0건과 따로">
      <ServerSearch />
    </DemoBlock>

    <DemoBlock title="가장 나쁜 값 — 목록 400개 · 긴 이름(한 줄에 안 들어가면 줄이 늘어난다) · 스크롤해도 검색칸이 붙어 있다. 한글을 치는 동안(조합 중)에도 걸러진다">
      <ManyItems />
    </DemoBlock>
  </div>
);
