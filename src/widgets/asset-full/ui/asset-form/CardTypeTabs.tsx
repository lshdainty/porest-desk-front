import { Label } from "@/shared/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { CardType } from "@/entities/card";

import type { AssetForm } from "./use-asset-form";

export function CardTypeTabs({ f }: { f: AssetForm }) {
  const { t, isNew, cardType, setCardType, setSelectedCard } = f;
  return (
    <>
      <div>
        <Label className="text-[13px] font-medium mb-2 block">
          {t("editDialog.cardTypeLabel")}
        </Label>
        <Tabs
          value={cardType}
          onValueChange={(v) => {
            if (!v) return;
            setCardType(v as CardType);
            if (isNew) setSelectedCard(null);
          }}
        >
          <TabsList variant="pill" size="sm" className="w-full">
            <TabsTrigger value="CREDIT" className="flex-1">
              {t("assetType.creditcard")}
            </TabsTrigger>
            <TabsTrigger value="CHECK" className="flex-1">
              {t("assetType.checkcard")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </>
  );
}
