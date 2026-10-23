import { useTranslation } from "react-i18next";
import {
  TopNavigation,
  TopNavigationActions,
  TopNavigationBackButton,
  TopNavigationTextButton,
  TopNavigationTitle,
} from "@/shared/ds/top-navigation";
import type { SectionDef, SectionId } from "../model/sections";

interface Props {
  activeSection: SectionDef | null;
  /** ← — 들어온 화면으로(History), 앞 화면이 없으면 상위로 고쳐 쓴다 */
  goBack: () => void;
  /** 머리 오른쪽 글 버튼(섹션마다 하나 — HEAD_ACTION) 을 눌렀다 */
  onHeadAction: (id: SectionId) => void;
  body: React.ReactNode;
}

/**
 * 머리 오른쪽 글 버튼을 두는 섹션 — 한 표. 글은 common 의 키.
 * 계좌 · 프리셋 · 반복 "추가" 는 각 본문 지시서(I-17 26 · I-20 C 13 · D 21)가 이 표에 한 줄씩 더한다.
 */
const HEAD_ACTION: Partial<Record<SectionId, { key: string }>> = {
  categories: { key: "add" },
};

/**
 * 폰 하위 화면 껍데기(I-16 10 ~ 13) — 흐름 안 흰 면. 머리는 ds Top Navigation standard,
 * 본문은 머리 바로 아래(틈 0)에서 화면 바닥까지 흰 면이고 여백은 본문이 갖는다.
 */
export const SettingsSubpageMobile = ({
  activeSection,
  goBack,
  onHeadAction,
  body,
}: Props) => {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const action = activeSection ? HEAD_ACTION[activeSection.id] : undefined;
  return (
    <>
      <TopNavigation type="standard">
        <TopNavigationBackButton
          fallbackHref="/desk/settings"
          onClick={goBack}
        />
        <TopNavigationTitle>
          {activeSection ? t(activeSection.labelKey) : ""}
        </TopNavigationTitle>
        {activeSection && action && (
          <TopNavigationActions>
            <TopNavigationTextButton
              onClick={() => onHeadAction(activeSection.id)}
            >
              {tCommon(action.key)}
            </TopNavigationTextButton>
          </TopNavigationActions>
        )}
      </TopNavigation>
      <div className="min-h-0 flex-1 bg-bg-layer-default">{body}</div>
    </>
  );
};
