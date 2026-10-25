import { CreditCard } from "lucide-react";
import { AssetLogo } from "@/entities/asset";

import type { AssetForm } from "./use-asset-form";

export function PreviewTile({ f }: { f: AssetForm }) {
  const {
    editingGroup,
    brand,
    selectedCard,
    brandColor,
    previewBg,
    previewFg,
    previewName,
    previewSub,
    item,
  } = f;
  return (
    <>
      {/* Preview */}
      <div className="flex items-center gap-3">
        {editingGroup === "card" && selectedCard?.imgUrl ? (
          <img
            src={selectedCard.imgUrl}
            alt=""
            className="rounded-[var(--radius-md)] object-cover flex-shrink-0"
            style={{ width: 68, height: 44 }}
          />
        ) : editingGroup === "card" ? (
          <span
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] flex-shrink-0"
            style={{
              width: 68,
              height: 44,
              background: previewBg,
              color: previewFg,
            }}
          >
            <CreditCard size={20} />
          </span>
        ) : (
          <AssetLogo
            asset={{
              assetName: previewName,
              institution: brand,
              color: brandColor?.bg ?? item?.color ?? null,
            }}
            size={52}
          />
        )}
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-[var(--fg-primary)] truncate">
            {previewName}
          </div>
          <div className="text-xs text-[var(--fg-tertiary)] mt-0.5">
            {previewSub}
          </div>
        </div>
      </div>
    </>
  );
}
