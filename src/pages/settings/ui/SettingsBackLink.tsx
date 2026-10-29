import { useNavigate } from "react-router-dom";
import { ParentLink } from "@/shared/ui/groo/parent-link";
import { useSettingsFrame } from "@/shared/ui/groo/settings-frame-context";
import { isPlainClick } from "../model/plain-click";

/**
 * "‹ {부모}" — 설정 하위 구역의 돌아가기(공용 `ParentLink`). 떠나기 전에 묻는 화면(금액 가리기)은
 * 틀에 맡긴 가드를 먼저 거친다.
 */
export function SettingsBackLink({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  const frame = useSettingsFrame();
  return (
    <ParentLink
      to={to}
      label={label}
      onClick={(e) => {
        const guard = frame?.getLeaveGuard();
        if (!guard || !isPlainClick(e)) return;
        e.preventDefault();
        guard(() => navigate(to));
      }}
    />
  );
}
