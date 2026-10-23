import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ScreenBands } from "@/shared/ui/groo/screen-bands";
import { useTranslation } from "react-i18next";
import { isEn } from "@/shared/lib/groo/format";
import { parseServerUtc, toLocalDateKey } from "@/shared/lib/date";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { focusScreenTitle, useScreenTitle } from "@/shared/ds/top-navigation";
import {
  CalendarDays,
  ChevronRight,
  Link2,
  Eye,
  EyeOff,
  Key,
  LogOut,
  Monitor,
  Trash2,
  Sparkles,
} from "lucide-react";
import { BudgetManager } from "@/widgets/budget-manage";
import { CategoryManager } from "@/widgets/category-manage";
import { PresetManager } from "@/widgets/preset-manage";
import { RecurringManager } from "@/widgets/recurring-manage";
import {
  CalendarLabelsSection,
  CalendarShareSection,
  TodoTagManager,
} from "@/widgets/calendar-manage";
import { MemoTagManager } from "@/widgets/memo-manage";
import { NotificationsManager } from "@/widgets/notification-manage";
import { DataExportSection } from "@/widgets/data-transfer";
import {
  AppearanceSection,
  DevicesSection,
  HideAmountsSection,
} from "@/widgets/account-settings";
import { AccountManager, SavingGoalManager } from "@/widgets/asset-full";
import { Card, CardContent } from "@/shared/ui/card";
import { useCurrentUser, WithdrawDialog } from "@/features/user";
import { useAuth } from "@/features/auth";
import { SubscriptionDialog } from "@/features/subscription/ui/SubscriptionDialog";
import { SecuritiesLinkDialog } from "@/features/subscription/ui/SecuritiesLinkDialog";
import {
  useMyFeatures,
  useMySubscription,
} from "@/features/subscription/model/useSubscription";
import {
  oauthLinkApi,
  useOAuthProviders,
  useUnlinkOAuth,
} from "@/features/oauth-link";
import { oauthKeys } from "@/shared/config";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { ALL_HIDE_CARDS } from "@/shared/lib/groo/hide-amounts-cards";
import { useHiddenCards } from "@/shared/lib/groo/hide-amounts-core";
/*
 * 비밀번호 변경 다이얼로그만 지연 로딩한다.
 *
 * 이 다이얼로그가 레포에서 **유일하게 zod 를 쓰는 곳**이라, 같이 묶이면 설정 화면에
 * 들어오기만 해도 검증 라이브러리를 통째로 받는다(gzip 19 KB). 실제로 여는 사람은
 * 비밀번호를 바꿀 때뿐이라 그때 받는다.
 *
 * 컴포넌트가 이미 `if (!open) return null` 이라 닫힘 애니메이션이 없다 — 열릴 때만
 * 렌더해도 보이는 동작은 같다.
 */
const PasswordChangeDialog = lazy(() =>
  import("@/widgets/sidebar/ui/PasswordChangeDialog").then((m) => ({
    default: m.PasswordChangeDialog,
  })),
);
import { ConfirmDialog } from "@/shared/ui/groo/dialogs";
import { MobileBackHeader } from "@/shared/ui/groo/mobile-back-header";
import {
  MENU_GROUPS,
  SECTION_IDS,
  SECTIONS,
  type SectionDef,
  type SectionId,
} from "../model/sections";
import { useSettingsBack } from "../model/use-settings-back";
import { SettingsDesktopFrame } from "./SettingsDesktopFrame";
import { SettingsSubpageMobile } from "./SettingsSubpageMobile";

type OutletCtx = { onAddTx: () => void; mobile: boolean };

// 소셜 연동 provider → 표시 이름. 서버 미지원 provider 는 원문(소문자) 그대로 노출.
const OAUTH_PROVIDER_LABELS: Record<string, string> = { google: "Google" };

export const SettingsPage = () => {
  const { t } = useTranslation("settings");
  const { mobile } = useOutletContext<OutletCtx>();
  // 폰 머리 오른쪽 "추가" 를 누른 횟수 — 카테고리 본문이 이 값이 바뀔 때 추가 폼을 연다.
  const [addRequests, setAddRequests] = useState<
    Partial<Record<SectionId, number>>
  >({});
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const querySection = (() => {
    const q = searchParams.get("section");
    return q && (SECTION_IDS as string[]).includes(q) ? (q as SectionId) : null;
  })();
  // 섹션은 주소에서만 읽는다 — 기록을 남기므로(changeSection) 뒤로 · 앞으로 가기가 주소만 바꾸고,
  // 상태를 따로 들면 화면과 주소가 어긋난다.
  const section: SectionId | "menu" =
    querySection ?? (mobile ? "menu" : "categories");

  const activeSection =
    section === "menu"
      ? null
      : (SECTIONS.find((s) => s.id === section) ?? null);

  const goBack = useSettingsBack(activeSection);

  // 문서 제목 "{섹션 이름} - 그루 담다"(메뉴는 "설정") — 셸 ScreenEffects 는 경로만 봐서 ?section= 은 여기서 쓴다.
  useScreenTitle(activeSection ? t(activeSection.labelKey) : t("page.title"));
  // 섹션이 바뀌면(앞으로 · 뒤로 모두) 본문 맨 위 · 새 제목에 초점 — 처음 열 때는 훔치지 않는다.
  const lastFocused = useRef(section);
  useEffect(() => {
    if (lastFocused.current === section) return;
    lastFocused.current = section;
    const frame = requestAnimationFrame(() => focusScreenTitle());
    return () => cancelAnimationFrame(frame);
  }, [section]);

  // 소셜 연동 복귀 처리 — SSO→Google 연동 후 ?linked=<provider>(성공) / ?linkError=<msg>(실패) 를
  // 달고 이 페이지로 돌아온다. 알림 노출 + provider 상태 재조회 + 쿼리 제거.
  //
  // 딱 한 번만 돈다. 예전엔 의존성을 `[]` 로 비워 그걸 표현했는데, 몸통이 실제로 읽는
  // 값들과 어긋나 규칙을 꺼야 했다 — 의존성은 정직하게 적고 "한 번" 은 플래그로 적는다.
  const oauthReturnHandled = useRef(false);
  useEffect(() => {
    if (oauthReturnHandled.current) return;
    const linked = searchParams.get("linked");
    const linkError = searchParams.get("linkError");
    if (!linked && !linkError) return;
    oauthReturnHandled.current = true;

    if (linked) {
      const name = OAUTH_PROVIDER_LABELS[linked.toLowerCase()] ?? linked;
      toast.success(t("account.toast.linked", { name }));
      queryClient.invalidateQueries({ queryKey: oauthKeys.all });
    } else if (linkError) {
      toast.error(linkError || t("account.toast.linkError"));
    }

    // 새로고침·뒤로가기 시 알림이 재노출되지 않도록 쿼리스트링 제거 (section 등 나머지는 보존).
    const url = new URL(window.location.href);
    url.searchParams.delete("linked");
    url.searchParams.delete("linkError");
    window.history.replaceState(window.history.state, "", url.toString());
  }, [searchParams, queryClient, t]);

  // 섹션 바꾸기 = 기록을 남긴다(push) — 브라우저 뒤로 가기가 설정 안을 거슬러 간다.
  // 같은 섹션을 다시 누르면 아무것도 하지 않는다.
  const changeSection = (next: SectionId | "menu") => {
    if (next === section) return;
    const p = new URLSearchParams(searchParams);
    if (next === "menu") p.delete("section");
    else p.set("section", next);
    setSearchParams(p);
  };

  /**
   * 메뉴 항목 클릭.
   * 외부 링크 항목(처리방침 등)은 열 내부 화면이 없으므로 새 탭으로 띄운다.
   */
  const openSection = (s: SectionDef) => {
    if (s.externalUrl) {
      window.open(s.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }
    changeSection(s.id);
  };

  const renderBody = (m: boolean) => {
    if (!activeSection) return null;
    switch (activeSection.id) {
      case "categories":
        return (
          <CategoryManager mobile={m} addRequest={addRequests.categories} />
        );
      case "accounts":
        return <AccountManager mobile={m} />;
      case "budget":
        return <BudgetManager mobile={m} />;
      case "goals":
        return <SavingGoalManager mobile={m} />;
      case "recurring":
        return (
          <RecurringManager mobile={m} addRequest={addRequests.recurring} />
        );
      case "presets":
        return <PresetManager mobile={m} addRequest={addRequests.presets} />;
      case "calendar-share":
        return <CalendarShareSection mobile={m} />;
      case "calendar-labels":
        return <CalendarLabelsSection mobile={m} />;
      case "todo-tags":
        return <TodoTagManager mobile={m} />;
      case "memo-tags":
        return <MemoTagManager mobile={m} />;
      case "appearance":
        return <AppearanceSection mobile={m} />;
      case "notifications":
        return <NotificationsManager mobile={m} />;
      case "data":
        return <DataExportSection mobile={m} />;
      case "account":
        return (
          <AccountSection
            mobile={m}
            onOpenHideAmounts={() => changeSection("hide-amounts")}
            onOpenDevices={() => changeSection("devices")}
          />
        );
      case "hide-amounts":
        return (
          <HideAmountsSection
            mobile={m}
            onBack={() => changeSection("account")}
          />
        );
      case "devices":
        return <DevicesSection mobile={m} />;
      default:
        return <PlaceholderSection section={activeSection} />;
    }
  };

  if (mobile) {
    if (section === "menu") {
      return (
        <MobileMenuView
          changeSection={changeSection}
          openSection={openSection}
        />
      );
    }

    // 금액 가리기는 헤더 액션(모두 선택)과 아래 고정 [저장] 이 있어 공용 서브페이지 셸을
    // 쓰지 않는다 — 앱 화면처럼 자기 셸을 직접 그린다.
    if (section === "hide-amounts") {
      return <HideAmountsSection mobile onBack={goBack} />;
    }

    return (
      <SettingsSubpageMobile
        activeSection={activeSection}
        goBack={goBack}
        onHeadAction={(id) =>
          setAddRequests((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }))
        }
        body={renderBody(true)}
      />
    );
  }

  return (
    <SettingsDesktopFrame
      section={section}
      activeSection={activeSection}
      openSection={openSection}
      renderBody={renderBody}
    />
  );
};

// ─── 모바일 메뉴 뷰 ────────────────────────────────────────────
function MobileMenuView({
  changeSection,
  openSection,
}: {
  changeSection: (id: SectionId | "menu") => void;
  /** 메뉴 항목 클릭 — 외부 링크 항목은 새 탭으로 열린다 */
  openSection: (s: SectionDef) => void;
}) {
  const { t } = useTranslation("settings");
  const { data: user } = useCurrentUser();

  return (
    <>
      {/* 풀스크린 페이지 — 앱처럼 ← 설정 헤더, 뒤로가면 '전체' */}
      <MobileBackHeader title={t("page.title")} />
      <ScreenBands list>
        {/* 내 정보 — 이름 헤더 행 하나가 첫 띠(design MobileSettingsList). 버튼의 인라인 바탕 · 여백이 띠 규칙을 덮지 않게 한 겹 감싼다 */}
        <div>
          <button
            onClick={() => changeSection("account")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: "100%",
              padding: "10px 0",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: "var(--bg-brand)",
                color: "var(--fg-on-brand)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 17,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {user?.userName ? user.userName.charAt(0) : "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "var(--fg-primary)",
                  letterSpacing: "-0.015em",
                }}
              >
                {user?.userName ?? t("account.defaultName")}
              </div>
              <div
                style={{
                  fontSize: "var(--text-label-sm)",
                  color: "var(--fg-tertiary)",
                  marginTop: 2,
                }}
              >
                {t("account.profileMeta")}
              </div>
            </div>
            <ChevronRight
              size={18}
              style={{ color: "var(--fg-tertiary)", flexShrink: 0 }}
            />
          </button>
        </div>

        {/* 그룹 — 묶음마다 화면 폭 흰 띠(I-01 결정 4B), 라벨 + 텍스트 행(터치 dim) */}
        {MENU_GROUPS.map((group) => {
          const groupSections = group.sectionIds
            .map((id) => SECTIONS.find((s) => s.id === id))
            .filter((s): s is SectionDef => s !== undefined);

          return (
            <div key={group.labelKey}>
              <div
                style={{
                  fontSize: "var(--text-body-lg)",
                  fontWeight: 700,
                  color: "var(--fg-primary)",
                  letterSpacing: "-0.01em",
                  padding: "10px 0 4px",
                }}
              >
                {t(group.labelKey)}
              </div>
              <div>
                {groupSections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openSection(s)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "13px 0",
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.opacity = "0.55";
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.7";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontSize: "var(--text-body-md)",
                        fontWeight: 500,
                        color: "var(--fg-primary)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {t(s.labelKey)}
                    </span>
                    <ChevronRight
                      size={15}
                      style={{ color: "var(--fg-tertiary)", flexShrink: 0 }}
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </ScreenBands>
    </>
  );
}

// ─── Account Section ───────────────────────────────────────────
function AccountSection({
  mobile,
  onOpenHideAmounts,
  onOpenDevices,
}: {
  mobile: boolean;
  /** 보안 > 금액 가리기 — 카드 37장을 훑는 목록이라 자기 화면으로 보낸다. */
  onOpenHideAmounts: () => void;
  onOpenDevices: () => void;
}) {
  const { t } = useTranslation("settings");
  const { t: tu } = useTranslation("user");
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  // 다시 로그인해야 돌아올 수 있다 — 앱은 이미 한 번 더 묻는다.
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [securitiesOpen, setSecuritiesOpen] = useState(false);

  const hiddenCount = useHiddenCards().size;

  const featuresQ = useMyFeatures();
  const subQ = useMySubscription();
  const isPro = featuresQ.data?.features?.includes("SECURITIES") ?? false;
  // currentPeriodEnd 는 서버가 시간대 없이 주는 `[UTC]` (백엔드 UserSubscription 의
  // LocalDateTime). 문자열을 자르면 UTC 날짜가 그대로 나와, UTC 15:00 이후에 갱신된
  // 구독은 KST(+9)에서 다음 결제일이 **항상 하루 이르게** 보인다. 로컬 날짜로 옮긴다.
  // toLocalDateKey 는 null·빈 값·파싱 실패에 null 을 주므로 아래 null 분기가 그대로 산다.
  // 못 읽는 값이면 원문 앞 10자로 떨어뜨린다 — 앱(subscription_sheet.dart·account_screen.dart)과
  // 같은 폴백이다. null 로 두면 날짜가 통째로 사라져 앱은 날짜를 보여 주는데 웹만 안 보여 준다.
  const periodEnd = subQ.data?.currentPeriodEnd;
  const nextBill = periodEnd
    ? (toLocalDateKey(periodEnd) ?? periodEnd.slice(0, 10))
    : null;

  const nameInitial = user?.userName ? user.userName.charAt(0) : "?";

  // 가입 시각은 서버가 시간대 없이 주는 `[UTC]` — 그대로 읽으면 로컬로 둔갑해
  // 월말·월초 가입자가 한 달 이른/늦은 달로 보인다.
  const joinedAt = parseServerUtc(user?.joinedAt);

  // 소셜 계정 연동 — Google 만 서버 지원. provider 상태로 '연결/해제' 버튼과 desc 결정.
  const providersQ = useOAuthProviders();
  const unlinkGoogle = useUnlinkOAuth();
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const google = providersQ.data?.find((p) => p.type === "GOOGLE");
  const googleLinked = google?.linked ?? false;

  const onLinkGoogle = async () => {
    setLinkingGoogle(true);
    try {
      // returnUrl = 현재 설정 페이지 절대 URL. 연동 후 SSO 가 여기로 ?linked/?linkError 를 달고 복귀.
      const { startUrl } = await oauthLinkApi.startLink(
        "google",
        window.location.origin + window.location.pathname,
      );
      window.location.href = startUrl;
    } catch {
      // 에러 토스트는 전역 인터셉터가 노출. 여기선 버튼 상태만 복구.
      setLinkingGoogle(false);
    }
  };

  const onUnlinkGoogle = () => {
    unlinkGoogle.mutate("google", {
      // onSuccess 에서 provider 목록 재조회(invalidate) → 상태 자동 갱신.
      onSuccess: () => toast.success(t("account.toast.unlinked")),
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-2xl)",
      }}
    >
      {/* 프로필 헤더 — 모바일은 자산 요약과 동일한 keep 카드(raised) */}
      <Card
        variant={mobile ? "raised" : "shadow"}
        style={{
          padding: "28px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--bg-brand)",
            color: "var(--fg-on-brand)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          {nameInitial}
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--fg-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          {user?.userName ?? t("account.defaultName")}
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-tertiary)" }}>
          {user?.userEmail ?? ""}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 4,
          }}
        >
          <Button variant="ghost" size="sm">
            ✎ {t("account.edit")}
          </Button>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-brand-subtle)",
              color: "var(--fg-brand-strong)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {isPro ? "Pro" : "Free"}
          </span>
        </div>
        {joinedAt && (
          <div
            style={{ fontSize: 12, color: "var(--fg-tertiary)", marginTop: 2 }}
          >
            {t("account.joined", {
              date: isEn()
                ? joinedAt.toLocaleDateString("en", {
                    year: "numeric",
                    month: "short",
                  })
                : `${joinedAt.getFullYear()}년 ${joinedAt.getMonth() + 1}월`,
            })}
          </div>
        )}
      </Card>

      {/* 보안 */}
      <AccountGroup mobile={mobile} label={t("account.group.security")}>
        <AccountRow
          mobile={mobile}
          icon={<Key size={20} style={{ color: "var(--fg-secondary)" }} />}
          label={tu("passwordChange")}
          desc={t("account.password.desc")}
          right={
            <ChevronRight size={16} style={{ color: "var(--fg-tertiary)" }} />
          }
          onClick={() => setPwDialogOpen(true)}
        />
        {/* 금액 가리기 — 들어가 보지 않아도 몇 장을 가렸는지 행에서 보인다. */}
        <AccountRow
          mobile={mobile}
          icon={
            hiddenCount > 0 ? (
              <EyeOff size={20} style={{ color: "var(--fg-secondary)" }} />
            ) : (
              <Eye size={20} style={{ color: "var(--fg-secondary)" }} />
            )
          }
          label={t("hideAmounts.label")}
          desc={
            <span className="num">
              {hiddenCount} / {ALL_HIDE_CARDS.length}
            </span>
          }
          right={
            <ChevronRight size={16} style={{ color: "var(--fg-tertiary)" }} />
          }
          onClick={onOpenHideAmounts}
        />
        <AccountRow
          mobile={mobile}
          icon={<Monitor size={20} style={{ color: "var(--fg-secondary)" }} />}
          label={t("account.devices.label")}
          desc={t("account.devices.desc")}
          right={
            <ChevronRight size={16} style={{ color: "var(--fg-tertiary)" }} />
          }
          onClick={onOpenDevices}
        />
        <AccountRow
          mobile={mobile}
          icon={
            <CalendarDays size={20} style={{ color: "var(--fg-secondary)" }} />
          }
          label={t("account.loginHistory.label")}
          desc={t("account.loginHistory.desc")}
          right={
            <ChevronRight size={16} style={{ color: "var(--fg-tertiary)" }} />
          }
          isLast
        />
      </AccountGroup>

      {/* 연결된 계정 */}
      <AccountGroup mobile={mobile} label={t("account.group.connected")}>
        <AccountRow
          mobile={mobile}
          icon={
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--fg-secondary)",
              }}
            >
              G
            </span>
          }
          label="Google"
          desc={googleLinked ? t("account.linked") : t("account.notLinked")}
          right={
            googleLinked ? (
              <Button
                variant="outline"
                size="sm"
                style={{ fontSize: 12, padding: "4px 10px", height: "auto" }}
                onClick={onUnlinkGoogle}
                loading={unlinkGoogle.isPending}
                disabled={providersQ.isLoading}
              >
                {t("account.unlink")}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                style={{ fontSize: 12, padding: "4px 10px", height: "auto" }}
                onClick={onLinkGoogle}
                loading={linkingGoogle}
                disabled={providersQ.isLoading}
              >
                {t("account.link")}
              </Button>
            )
          }
        />
        <AccountRow
          mobile={mobile}
          icon={
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--fg-secondary)",
              }}
            >
              A
            </span>
          }
          label="Apple ID"
          desc={t("account.notLinked")}
          right={
            <Button
              variant="outline"
              size="sm"
              disabled
              style={{ fontSize: 12, padding: "4px 10px", height: "auto" }}
            >
              {t("account.link")}
            </Button>
          }
        />
        <AccountRow
          mobile={mobile}
          icon={
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--fg-secondary)",
              }}
            >
              K
            </span>
          }
          label={t("account.provider.kakao")}
          desc={t("account.notLinked")}
          right={
            <Button
              variant="outline"
              size="sm"
              disabled
              style={{ fontSize: 12, padding: "4px 10px", height: "auto" }}
            >
              {t("account.link")}
            </Button>
          }
        />
        <AccountRow
          mobile={mobile}
          icon={
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--fg-secondary)",
              }}
            >
              N
            </span>
          }
          label={t("account.provider.naver")}
          desc={t("account.notLinked")}
          right={
            <Button
              variant="outline"
              size="sm"
              disabled
              style={{ fontSize: 12, padding: "4px 10px", height: "auto" }}
            >
              {t("account.link")}
            </Button>
          }
          isLast
        />
      </AccountGroup>

      {/* 구독·결제 — 앱 account_screen 정합: 40 브랜드 칩 + 제목/부제 스택 + 가격/배지 + chevron */}
      <AccountGroup mobile={mobile} label={t("account.group.subscription")}>
        <SubscriptionRow
          mobile={mobile}
          isPro={isPro}
          nextBill={nextBill}
          autoRenew={subQ.data?.autoRenew}
          onClick={() => setSubOpen(true)}
        />
      </AccountGroup>

      {/* 증권 데이터 연동 — 구독(Pro) 시에만. 증권사가 둘 이상이라 다이얼로그로 분리했다. */}
      {isPro && (
        <AccountGroup mobile={mobile} label={t("account.group.securities")}>
          <AccountRow
            mobile={mobile}
            icon={<Link2 size={20} style={{ color: "var(--fg-secondary)" }} />}
            label={t("account.securities.label")}
            desc={t("account.securities.desc")}
            right={
              <ChevronRight size={16} style={{ color: "var(--fg-tertiary)" }} />
            }
            onClick={() => setSecuritiesOpen(true)}
            isLast
          />
        </AccountGroup>
      )}

      {/* 계정 관리 */}
      <AccountGroup mobile={mobile} label={t("account.group.manage")}>
        <AccountRow
          mobile={mobile}
          icon={<LogOut size={20} style={{ color: "var(--fg-secondary)" }} />}
          label={t("account.logout.label")}
          desc={t("account.logout.desc")}
          right={
            <ChevronRight size={16} style={{ color: "var(--fg-tertiary)" }} />
          }
          onClick={() => setConfirmLogout(true)}
        />
        <AccountRow
          mobile={mobile}
          icon={
            <Trash2 size={20} style={{ color: "var(--color-fg-critical)" }} />
          }
          label={t("account.withdraw.label")}
          desc={t("account.withdraw.desc")}
          labelColor="var(--color-fg-critical)"
          isLast
          onClick={() => setConfirmWithdraw(true)}
        />
      </AccountGroup>

      {confirmLogout && (
        <ConfirmDialog
          title={t("account.logout.label")}
          message={t("account.logout.confirmMessage")}
          confirmLabel={t("account.logout.label")}
          onCancel={() => setConfirmLogout(false)}
          onConfirm={() => logout()}
        />
      )}

      {confirmWithdraw && (
        <WithdrawDialog
          onClose={() => setConfirmWithdraw(false)}
          // 해지한 사람을 로그인 화면으로 떨어뜨리지 않는다 — 왜 안 들어가지는지
          // 모른 채 비밀번호만 다시 넣어 보게 된다. 안내 화면으로 보낸다.
          // 보던 자리도 적어 두지 않는다(`remember: false`) — 돌아갈 자리가 없다.
          onWithdrawn={() =>
            logout({ returnTo: "/withdrawn", remember: false })
          }
        />
      )}

      {/* 비밀번호 변경 다이얼로그 — 열 때 받는다(위 lazy 주석 참고) */}
      {pwDialogOpen && (
        <Suspense fallback={null}>
          <PasswordChangeDialog open onOpenChange={setPwDialogOpen} />
        </Suspense>
      )}

      {/* 구독 관리 다이얼로그 */}
      {subOpen && (
        <SubscriptionDialog onClose={() => setSubOpen(false)} mobile={mobile} />
      )}
      {securitiesOpen && (
        <SecuritiesLinkDialog
          onClose={() => setSecuritiesOpen(false)}
          mobile={mobile}
        />
      )}
    </div>
  );
}

// ─── AccountGroup ──────────────────────────────────────────────
function AccountGroup({
  label,
  children,
  mobile,
}: {
  label: string;
  children: React.ReactNode;
  mobile?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--fg-primary)",
          // 모바일=플랫 리스트라 라벨이 첫 행에 가깝게(8) / 데스크톱=카드 위 라벨이라 여백 12.
          paddingBottom: mobile ? 8 : 12,
        }}
      >
        {label}
      </div>
      {/* 모바일 카드 다이어트(사용자 결정) — 셸 없이 플랫 리스트. 데스크톱은 카드 유지. */}
      <div
        style={
          mobile
            ? undefined
            : {
                background: "var(--bg-surface)",
                boxShadow: "var(--shadow-sm)",
                borderRadius: "var(--radius-card)",
                overflow: "hidden",
              }
        }
      >
        {children}
      </div>
    </div>
  );
}

// ─── AccountRow ────────────────────────────────────────────────
interface AccountRowProps {
  icon: React.ReactNode;
  label: string;
  /** 우측 보조 텍스트. 숫자를 넣을 땐 `num`(tabular) 로 감싼다 — 자릿수가 흔들리지 않게. */
  desc?: React.ReactNode;
  right?: React.ReactNode;
  isLast?: boolean;
  onClick?: () => void;
  dimmed?: boolean;
  labelColor?: string;
  asChild?: boolean;
  /** 모바일=플랫(좌우 inset 0) / 데스크톱=카드 내부라 좌우 inset 필요. */
  mobile?: boolean;
}

function AccountRow({
  icon,
  label,
  desc,
  right,
  isLast,
  onClick,
  dimmed,
  labelColor,
  asChild,
  mobile,
}: AccountRowProps) {
  const content = (
    <>
      <span
        style={{
          width: 24,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 600,
          color: labelColor ?? "var(--fg-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
      {desc && (
        <span style={{ fontSize: 12, color: "var(--fg-tertiary)" }}>
          {desc}
        </span>
      )}
      {right}
    </>
  );

  const sharedStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    // 모바일 카드 다이어트 = 좌우 inset 0(사용자 결정) / 데스크톱은 카드 내부라 20 inset.
    padding: mobile ? "14px 0" : "15px 20px",
    borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
  };

  if (asChild) {
    return (
      <button
        style={{
          border: 0,
          ...sharedStyle,
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
        }}
      >
        {content}
      </button>
    );
  }

  if (onClick && !dimmed) {
    return (
      <button
        onClick={onClick}
        style={{
          border: 0,
          ...sharedStyle,
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--bg-muted)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      style={{
        ...sharedStyle,
        cursor: dimmed ? "default" : "default",
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      {content}
    </div>
  );
}

// ─── SubscriptionRow (구독·결제) ───────────────────────────────
// 앱 account_screen 구독 행 정합 — generic AccountRow(가로 desc)는 긴 부제에서
// 제목이 글자단위로 깨져, 40 브랜드 칩 + 제목/부제 세로 스택 + 우측 가격/배지로 분리.
export function SubscriptionRow({
  isPro,
  nextBill,
  autoRenew,
  onClick,
  mobile,
}: {
  isPro: boolean;
  nextBill: string | null;
  /**
   * 구독의 자동갱신 여부. 조회가 아직 안 왔으면 `undefined` — 그땐 종전대로 말한다.
   */
  autoRenew?: boolean;
  onClick: () => void;
  /** 모바일=플랫(좌우 inset 0) / 데스크톱=카드 내부라 좌우 inset 필요. */
  mobile?: boolean;
}) {
  const { t } = useTranslation("settings");
  // 해지해도 서버는 자동갱신만 끄고 **기간 끝까지 Pro 를 유지한다**(desk-back #332).
  // 그래서 이 줄은 유예 기간에도 Pro 로 서고 날짜도 그대로 남는데, 그날은 더 이상
  // 결제일이 아니라 **종료일**이다. 구독 배너는 이미 그렇게 말하므로(#384) 설정
  // 화면만 '다음 결제'로 남으면 **같은 날짜를 두 화면이 다르게 부른다.**
  // `=== false` 로 좁히는 건 값이 안 왔을 때(undefined) 기존 동작을 그대로 두려는 것이다.
  const periodLabel = nextBill
    ? autoRenew === false
      ? t("account.sub.proActiveUntil", { date: nextBill })
      : t("account.sub.proActiveBill", { date: nextBill })
    : t("account.sub.proActive");
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        // 모바일 카드 다이어트 = 좌우 inset 0 / 데스크톱은 카드 내부라 20 inset.
        padding: mobile ? "14px 0" : "15px 20px",
        border: 0,
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--bg-muted)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--radius-md)",
          background: "var(--bg-brand-subtle)",
          color: "var(--fg-brand)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Sparkles size={18} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--text-body-sm)",
            fontWeight: 700,
            color: "var(--fg-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          담다 Pro
        </div>
        <div
          style={{
            fontSize: "var(--text-caption)",
            color: "var(--fg-tertiary)",
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {isPro ? periodLabel : t("account.sub.proPromo")}
        </div>
      </div>
      {isPro ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            flexShrink: 0,
          }}
        >
          <div
            className="num"
            style={{
              fontSize: "var(--text-body-sm)",
              fontWeight: 700,
              color: "var(--fg-primary)",
            }}
          >
            9,900원
          </div>
          <div
            style={{
              fontSize: "var(--text-badge)",
              color: "var(--fg-tertiary)",
              marginTop: 2,
            }}
          >
            {t("account.sub.perMonth")}
          </div>
        </div>
      ) : (
        <Badge variant="default">{t("account.sub.proStart")}</Badge>
      )}
      <ChevronRight
        size={16}
        style={{ color: "var(--fg-tertiary)", flexShrink: 0 }}
      />
    </button>
  );
}

// ─── PlaceholderSection ────────────────────────────────────────
function PlaceholderSection({ section }: { section: SectionDef }) {
  const { t } = useTranslation("settings");
  const IconComp = section.icon;
  return (
    <Card
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-card)",
      }}
    >
      <CardContent style={{ padding: 40, paddingTop: 40, textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-brand-subtle)",
            color: "var(--fg-brand-strong)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <IconComp size={22} strokeWidth={1.9} />
        </div>
        <div
          style={{
            fontSize: "var(--text-body-lg)",
            fontWeight: "700",
            marginBottom: 4,
          }}
        >
          {t(section.labelKey)}
        </div>
        <div
          style={{
            fontSize: "var(--text-label-sm)",
            color: "var(--fg-tertiary)",
          }}
        >
          {t(section.descKey)}
        </div>
        <div
          style={{
            fontSize: "var(--text-badge)",
            color: "var(--fg-tertiary)",
            marginTop: 14,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {t("account.comingSoon")}
        </div>
      </CardContent>
    </Card>
  );
}
