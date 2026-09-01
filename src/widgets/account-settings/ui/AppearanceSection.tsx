import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Monitor, Moon, Sun } from "lucide-react";
import { RadioList, RadioListItem } from "@/shared/ui/radio-list";
import { TileGroup, TileItem } from "@/shared/ui/tile";
import { useTheme } from "@/shared/ui/theme-provider";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { regionOptionsWith } from "@/shared/lib";
import { useUserPreferences, useUpdateUserPreferences } from "@/features/user";

type CurrencyKey = "KRW" | "USD" | "EUR" | "JPY";

const CURRENCY_STORAGE_KEY = "pd-currency";

const THEME_OPTIONS: {
  k: "light" | "dark" | "system";
  labelKey: string;
  descKey: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  {
    k: "light",
    labelKey: "theme.light",
    descKey: "theme.lightDesc",
    Icon: Sun,
  },
  { k: "dark", labelKey: "theme.dark", descKey: "theme.darkDesc", Icon: Moon },
  {
    k: "system",
    labelKey: "theme.system",
    descKey: "theme.systemDesc",
    Icon: Monitor,
  },
];

const CURRENCY_OPTIONS: { k: CurrencyKey; labelKey: string; symbol: string }[] =
  [
    { k: "KRW", labelKey: "currency.KRW", symbol: "₩" },
    { k: "USD", labelKey: "currency.USD", symbol: "$" },
    { k: "EUR", labelKey: "currency.EUR", symbol: "€" },
    { k: "JPY", labelKey: "currency.JPY", symbol: "¥" },
  ];

function readCurrency(): CurrencyKey {
  try {
    const v = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (v === "KRW" || v === "USD" || v === "EUR" || v === "JPY") return v;
  } catch {
    /* ignore */
  }
  return "KRW";
}

// 모바일 카드 다이어트 — 설정 행 셸: 모바일은 플랫 행, 데스크톱은 Card (.m-subpage 정합).
export function AppearanceSection({ mobile }: { mobile: boolean }) {
  const { t, i18n } = useTranslation("settings");
  const { theme, setTheme } = useTheme();
  const [currency, setCurrencyState] = useState<CurrencyKey>(readCurrency);

  const { data: prefs } = useUserPreferences();
  const updatePrefs = useUpdateUserPreferences();
  const isEnLang = i18n.language?.startsWith("en") ?? false;
  // 저장된 값이 목록에 없을 수도 있어(가입 후 목록 변경 등) 현재 값을 옵션에 끼워 넣는다.
  const regionOptions = regionOptionsWith(prefs?.timezone);

  const handleRegionChange = (tz: string) => {
    if (!tz || tz === prefs?.timezone) return;
    updatePrefs.mutate({ timezone: tz });
  };

  const setCurrency = (c: CurrencyKey) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-2xl)",
      }}
    >
      {/* label + content = 한 세트(flex 묶음, 내부 gap sm=8). 세트끼리는 최상위 gap-2xl(32). */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-sm)",
        }}
      >
        <SectionLabel>{t("theme.label")}</SectionLabel>
        {/* 클로드 디자인 정합(사용자 결정) — 모바일도 3열 세로 스택 타일. */}
        <TileGroup
          columns={3}
          value={theme}
          onValueChange={(v) => setTheme(v as typeof theme)}
        >
          {THEME_OPTIONS.map((opt) => (
            // 스와치 배경 앱 정합(사용자 결정) — 테마 실색 미리보기 대신 bg-muted + fg-secondary 아이콘.
            <TileItem
              key={opt.k}
              value={opt.k}
              label={t(opt.labelKey)}
              description={t(opt.descKey)}
              swatch={
                <span
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "var(--bg-muted)",
                    color: "var(--fg-secondary)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <opt.Icon size={18} strokeWidth={1.9} />
                </span>
              }
            />
          ))}
        </TileGroup>
      </section>

      {/* 개인정보 보호(금액 가리기)는 계정 > 보안으로 옮겼다(앱 정합) — 보안 설정이
          두 화면에 나뉘어 있으면 어디서 껐는지 찾게 된다. */}

      {/* 표시 기준 지역 — 서버가 이 값으로 "오늘"을 판단하므로 로컬이 아니라 서버에 저장한다. */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-sm)",
        }}
      >
        <SectionLabel>{t("region.label")}</SectionLabel>
        <Select
          value={prefs?.timezone ?? ""}
          onValueChange={handleRegionChange}
          disabled={!prefs || updatePrefs.isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("region.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {regionOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {isEnLang ? o.en : o.ko}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div
          style={{
            fontSize: "var(--text-caption)",
            color: "var(--fg-tertiary)",
          }}
        >
          {t("region.desc")}
        </div>
      </section>

      {/* label + content = 한 세트(flex 묶음, 내부 gap sm=8). 세트끼리는 최상위 gap-2xl(32). */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-sm)",
        }}
      >
        <SectionLabel>{t("language.label")}</SectionLabel>
        <Tabs
          value={i18n.language?.startsWith("en") ? "en" : "ko"}
          onValueChange={(v) => v && i18n.changeLanguage(v)}
        >
          <TabsList variant="pill" size="sm" className="w-full">
            <TabsTrigger value="ko" className="flex-1">
              {t("language.ko")}
            </TabsTrigger>
            <TabsTrigger value="en" className="flex-1">
              {t("language.en")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      {/* 개인정보·기본통화 label↔content gap: 모바일=0(사용자 결정, 플랫 리스트라 밀착)
          / 데스크톱=sm(8) — 아래가 카드라 라벨이 붙으면 답답함. */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: mobile ? undefined : "var(--spacing-md)",
        }}
      >
        <SectionLabel>{t("currency.label")}</SectionLabel>
        <RadioList
          value={currency}
          onValueChange={(v) => setCurrency(v as CurrencyKey)}
        >
          {CURRENCY_OPTIONS.map((c) => (
            <RadioListItem
              key={c.k}
              value={c.k}
              pill={<span className="num">{c.symbol}</span>}
              label={t(c.labelKey)}
              subLabel={<span className="num">{c.k}</span>}
            />
          ))}
        </RadioList>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "var(--text-label-sm)",
        fontWeight: "600",
        color: "var(--fg-tertiary)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </div>
  );
}
