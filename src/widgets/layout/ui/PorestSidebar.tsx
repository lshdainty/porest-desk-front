import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, ChevronsUpDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/shared/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { useCurrentUser } from "@/features/user";
import {
  useHasSecurities,
  useMyFeatures,
} from "@/features/subscription/model/useSubscription";
import { brokerPath, useBrokerLabel } from "@/features/stock/lib/broker";
import { BrandMark } from "@/shared/ui/brand-mark";
import { NAV, type NavItem } from "../model/nav";

export function PorestSidebar() {
  const { t } = useTranslation("layout");
  const location = useLocation();
  const navigate = useNavigate();
  const hasSecurities = useHasSecurities();
  // 증권 메뉴는 구독(SECURITIES) 보유 시에만 노출. slice 후 필터(그룹 경계 보존).
  const gate = (items: NavItem[]) =>
    hasSecurities ? items : items.filter((n) => n.id !== "stocks");
  const { data: features } = useMyFeatures();
  const brokerLabelOf = useBrokerLabel(hasSecurities);

  // **연결한 증권사만 하위에 둔다.** 사이드바는 갈 수 있는 곳을 나열하는 자리고,
  // 미연결 증권사를 넣으면 누를 때마다 "연결해 주세요" 로 되돌아오는 막다른 길이 된다.
  // 연결이 하나뿐이면 하위를 접는다 — 고를 게 없는 트리는 정보를 주지 않는다.
  // (페이지 안 탭도 `connected.length > 1` 에서만 떴다 — 같은 규칙을 자리만 옮긴 것.)
  const connectedBrokers = hasSecurities
    ? (features?.connectedBrokers ?? [])
    : [];
  const brokerChildren = connectedBrokers.length > 1 ? connectedBrokers : [];

  const { data: currentUser } = useCurrentUser();
  const userName = currentUser?.userName ?? "";
  const userEmail = currentUser?.userEmail ?? "";
  const userInitial = userName.charAt(0) || "·";

  const isActive = (path: string) =>
    path === "/desk"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  // **접힘은 경로에서 파생한다.** 보고 있는 화면이 증권 하위면 펼쳐져 있어야 지금 어디에
  // 있는지가 보인다. 사용자가 직접 건드린 뒤부터만 그 선택이 이긴다(`null` = 아직 안 건드림).
  //
  // 쿠키에 남기지 않는다 — 사이드바 자체(`sidebar_state`)는 지금 화면이 알려 주는 게 없어
  // 쿠키가 유일한 근거지만, 하위 메뉴는 경로가 근거를 준다. 접힘을 저장해 두면 증권사 화면을
  // 열었는데 하위가 닫힌 채 떠서 저장된 값이 화면과 어긋난다.
  //
  // 마운트 시점에 한 번 읽는 `defaultOpen` 이 아니라 매 렌더 파생인 이유: 부모 `증권` 을 눌러
  // 증권 화면으로 들어가면 사이드바는 마운트된 채 경로만 바뀐다 — 파생이라야 그때 따라 펼쳐진다.
  const [stocksOpenOverride, setStocksOpenOverride] = useState<boolean | null>(
    null,
  );

  const renderGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((it) => {
          const IconComp = it.icon;
          const children = it.id === "stocks" ? brokerChildren : [];
          const itemLabel = t(it.labelKey);
          const parentActive = isActive(it.path);
          const activeChild = children.find(
            (b) => location.pathname === brokerPath(b),
          );
          const subOpen = stocksOpenOverride ?? parentActive;
          const body = (
            <>
              <SidebarMenuButton
                tooltip={itemLabel}
                isActive={parentActive}
                // 지금 페이지가 하위 항목이면 `aria-current` 는 그 하나만 단다 — 조상까지
                // "page" 로 두면 스크린리더가 현재 위치를 둘로 읽는다. 시각 강조(`data-active`)는
                // 그대로 둬 부모가 활성인 건 보인다.
                aria-current={parentActive && !activeChild ? "page" : undefined}
                // **부모는 이동과 펼침을 함께 한다.** 경로 파생만으로도 증권 화면 밖에서
                // 누르면 따라 펼쳐지지만, 셰브론으로 한 번 접어 둔 뒤에는 오버라이드가
                // `false` 로 남아 이동만 하고 닫힌 채였다 — 눌러서 들어간 곳의 형제 화면이
                // 안 보인다. 그래서 여기서 오버라이드를 펼침으로 되돌린다.
                //
                // 이미 그 화면에 있어 이동이 no-op 일 때도 마찬가지로 **항상 펼친다.**
                // 토글로 만들면 같은 클릭이 갈 때는 열고 와 있을 때는 닫아 결과가 갈린다 —
                // 접는 자리는 셰브론 하나로 둔다.
                onClick={() => {
                  navigate(it.path);
                  // 하위가 없는 항목(대부분)은 건드리지 않는다 — 홈을 눌렀다고 증권이 펼쳐지면 안 된다.
                  if (children.length > 0) setStocksOpenOverride(true);
                }}
              >
                <IconComp />
                <span>{itemLabel}</span>
              </SidebarMenuButton>
              {children.length > 0 && (
                <>
                  {/* **접는 자리는 셰브론뿐이다.** 부모 버튼을 CollapsibleTrigger 로 감싸면
                      토글이 클릭을 먹어 기본 증권사 화면으로 갈 길이 막힌다(shadcn 예제가 그렇게
                      하는 건 그쪽 부모가 `url: "#"` 인 껍데기라서다 — 우리 부모는 갈 화면이 있다).
                      그래서 부모는 이동+펼침만, 접기는 셰브론이 맡는다. 둘은 형제 엘리먼트라
                      셰브론 클릭이 부모 onClick 으로 올라가지 않는다 — stopPropagation 불필요.
                      SidebarMenuAction 은 이 용도로 이미 있는 것이라 새로 만들 게 없다:
                      셰브론이 있으면 부모 버튼에 `pr-8` 이 자동으로 붙어 라벨이 밑에 안 깔리고
                      (sidebarMenuButtonVariants 의 `group-has-[[data-sidebar=menu-action]]`),
                      아이콘 모드에선 SidebarMenuSub 와 함께 스스로 숨는다. */}
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction
                      // `aria-expanded`·`aria-controls`·`data-state` 는 Radix 가 붙인다.
                      // 아이콘뿐이라 이름이 없으므로 그것만 여기서 준다.
                      aria-label={t(
                        subOpen ? "collapseSubmenu" : "expandSubmenu",
                        { name: itemLabel },
                      )}
                      className="data-[state=open]:rotate-90"
                    >
                      <ChevronRight />
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {children.map((b) => (
                        <SidebarMenuSubItem key={b}>
                          {/* asChild + Link — 진짜 <a> 라야 가운데클릭·새 탭이 산다.
                              부모 항목은 이동 말고 펼침도 해야 해서 onClick 으로 남는다. */}
                          <SidebarMenuSubButton
                            asChild
                            isActive={b === activeChild}
                            aria-current={
                              b === activeChild ? "page" : undefined
                            }
                          >
                            <Link to={brokerPath(b)}>
                              <span>{brokerLabelOf(b)}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              )}
            </>
          );
          // 하위가 없으면 Collapsible 도 없다 — 고를 게 없는 트리에 토글만 남기지 않는다.
          // `asChild` 로 li 자신이 Collapsible 루트가 된다: 셰브론이 부모 버튼의 형제로
          // 남아야 SidebarMenuAction 의 `peer-*` 세로 정렬이 계속 맞는다.
          return children.length > 0 ? (
            <Collapsible
              key={it.id}
              asChild
              open={subOpen}
              onOpenChange={setStocksOpenOverride}
            >
              <SidebarMenuItem>{body}</SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={it.id}>{body}</SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* 로그인 로고 미러(마크 svg + 실제 폰트 텍스트, gap 0) 축소판 — 합성 이미지 금지.
                확장: 마크+텍스트 중앙정렬, 접힘: 마크만. fg-brand 토큰이라 다크 자동 전환. */}
            <SidebarMenuButton
              size="lg"
              className="justify-center gap-0 data-[state=open]:bg-sidebar-accent"
            >
              {/* 마크 32(사용자 결정) — 펼침·접힘 동일.
                  span 래핑 — 버튼 기본 [&>svg]:size-4 가 직계 svg 를 16px 로 눌러서 회피. */}
              <span className="flex shrink-0 items-center justify-center">
                <BrandMark size={32} />
              </span>
              <span
                className="group-data-[collapsible=icon]:hidden"
                style={{
                  fontSize: "var(--text-title-lg)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--fg-primary)",
                }}
              >
                Porest Desk
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup(t("workspace"), gate(NAV.slice(0, 6)))}
        {renderGroup(t("records"), gate(NAV.slice(6)))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: "var(--bg-brand-muted)",
                  color: "var(--fg-brand-strong)",
                  fontWeight: "600",
                  fontSize: "var(--text-caption)",
                }}
              >
                {userInitial}
              </span>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span
                  className="truncate font-semibold"
                  style={{ fontSize: "var(--text-body-sm)" }}
                >
                  {userName || t("userFallback")}
                </span>
                <span
                  className="truncate text-xs"
                  style={{ color: "var(--fg-tertiary)" }}
                >
                  {userEmail || "—"}
                </span>
              </div>
              <ChevronsUpDown
                className="ml-auto size-4 group-data-[collapsible=icon]:hidden"
                style={{ color: "var(--fg-tertiary)" }}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
