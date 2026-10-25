import { Label } from "@/shared/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ACCOUNT_SUBS, ACCOUNT_SUB_KEY } from "../../lib/account-sub";

import type { AssetForm } from "./use-asset-form";

export function AccountSubTabs({ f }: { f: AssetForm }) {
  const { t, editingGroup, accountSub, setAccountSub } = f;
  return (
    <>
      {editingGroup === "account" && (
        <div>
          <Label className="text-[13px] font-medium mb-2 block">
            {t("editDialog.accountTypeLabel")}
          </Label>
          {/* 종류가 여섯이 되면서 모바일 폭(390)·영어 라벨에서 한 줄에 안 들어간다.
              트랙은 그대로 두고 가로 스크롤만 허용한다 — 넘치면 잘리는 대신 밀린다.
              `w-max min-w-full` 이라 자리가 남으면 예전처럼 꽉 채워 늘어난다. */}
          <div className="overflow-x-auto">
            <Tabs
              value={accountSub}
              onValueChange={(v) => v && setAccountSub(v as typeof accountSub)}
            >
              <TabsList variant="pill" size="sm" className="w-max min-w-full">
                {ACCOUNT_SUBS.map((s) => (
                  <TabsTrigger key={s} value={s} className="flex-1">
                    {t(`accountSub.${ACCOUNT_SUB_KEY[s]}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}
    </>
  );
}
