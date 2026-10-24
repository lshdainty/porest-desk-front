import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Settings } from "lucide-react";
import { ScreenBands } from "@/shared/ui/groo/screen-bands";
import { Button } from "@/shared/ds/button";
import { MonthBar } from "@/shared/ui/groo/month-bar";
import { useBudgetModel } from "./budget-model";
import {
  CategorySection,
  ComplianceSection,
  EmptyMonth,
  PaceSection,
  StatusSection,
  TotalSection,
} from "./budget-parts";

/**
 * 폰 예산 — 띠 셋(I-08 5): ① 이번 달 전체(달 줄 + 총 예산 + 지출 페이스) ② 카테고리(예산 현황 + 카테고리별 예산) ③ 지난 달들(최근 6개월 이행률).
 * 띠 사이 8 둘, 머리 아래 · 마지막 띠 아래 틈 0. 띠 안 구역 사이는 구역이 갖는 24 + 24 = 48(선 · 틈 없음), 달 줄 ↔ 총 예산은 12.
 * 이번 달 예산이 하나도 없으면 띠 ① 은 달 줄 + Result Section empty 이고 띠 ② 는 없다(Q3-B). 앱 `budget_screen.dart` 와 같은 구조 · 같은 값이다(짝 1).
 */
export function BudgetMobile() {
  const { t } = useTranslation("budget");
  const navigate = useNavigate();
  const m = useBudgetModel();
  const goToSettings = () => navigate("/desk/settings?section=budget");
  const monthBar = (
    <MonthBar
      monthKey={m.monthKey}
      onChange={m.setMonthKey}
      onStep={m.adjustMonth}
      right={
        <Button
          type="button"
          variant="ghost"
          ghostColor="neutralMuted"
          size="small"
          className="-mr-x3_5"
          onClick={goToSettings}
        >
          <Settings aria-hidden />
          {t("settings")}
        </Button>
      }
    />
  );
  return (
    // 폰 구역 화면 — 띠 사이 8 만 틈이다(I-05 74)
    <ScreenBands>
      <div data-band="flush" data-section="month">
        {monthBar}
        {m.noBudgets ? (
          <div className="pb-x6 pt-x3">
            <EmptyMonth m={m} onSettings={goToSettings} />
          </div>
        ) : (
          <>
            <section className="pt-x3" data-section="total">
              <TotalSection m={m} place="band" />
            </section>
            <section data-section="pace">
              <PaceSection m={m} place="band" />
            </section>
          </>
        )}
      </div>
      {!m.noBudgets && (
        <div data-band="flush" data-section="categories">
          <section data-section="status">
            <StatusSection m={m} place="band" />
          </section>
          <section data-section="list">
            <CategorySection m={m} place="band" onSettings={goToSettings} />
          </section>
        </div>
      )}
      {(!m.noBudgets || m.complianceHasData) && (
        <div data-band="flush" data-section="compliance">
          <ComplianceSection m={m} place="band" />
        </div>
      )}
    </ScreenBands>
  );
}
