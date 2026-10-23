import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/shared/ds/button";
import { useSettingsFrame } from "@/shared/ui/groo/settings-frame-context";
import { isPlainClick } from "../model/plain-click";

/**
 * "‹ {부모}" — 데스크톱 · 태블릿에서 적힌 부모로 가는 링크(Q1-A: 글자 = 가는 곳, I-16 7).
 * ds Button ghost small flush(왼쪽) · neutralSubtle + 꺾쇠 14, 라우터 Link 라 누르면 기록을 남기고(push)
 * 새 탭 · 가운데 클릭도 산다. 떠나기 전에 묻는 화면(금액 가리기)은 틀에 맡긴 가드를 먼저 거친다.
 */
export function SettingsBackLink({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  const frame = useSettingsFrame();
  return (
    <Button
      asChild
      variant="ghost"
      size="small"
      flush="left"
      ghostColor="neutralSubtle"
    >
      <Link
        to={to}
        onClick={(e) => {
          const guard = frame?.getLeaveGuard();
          if (!guard || !isPlainClick(e)) return;
          e.preventDefault();
          guard(() => navigate(to));
        }}
      >
        <ChevronLeft aria-hidden />
        {label}
      </Link>
    </Button>
  );
}
