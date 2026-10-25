import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NameCounter } from "@/shared/ui/groo/name-counter";
import { ASSET_NAME_MAX } from "./form-lib";
import type { AssetForm } from "./use-asset-form";

export function NameField({ f }: { f: AssetForm }) {
  const { name, setName, nameTrim, nameErr, nameLabel, namePlaceholder } = f;
  return (
    <>
      <div>
        <Label
          htmlFor="asset-edit-name"
          className="text-[13px] font-medium mb-2 block"
        >
          {nameLabel}
        </Label>
        <Input
          id="asset-edit-name"
          aria-invalid={!!nameErr}
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, ASSET_NAME_MAX))}
          placeholder={namePlaceholder}
          maxLength={ASSET_NAME_MAX}
        />
        <NameCounter len={nameTrim.length} max={ASSET_NAME_MAX} err={nameErr} />
      </div>
    </>
  );
}
