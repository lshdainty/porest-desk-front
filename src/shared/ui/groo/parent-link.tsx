import type { MouseEventHandler } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ds/button";

/**
 * "‹ {부모}" — 데스크톱 · 태블릿(768 이상) 하위 화면에서 적힌 부모로 가는 링크(Q1-A: 글자 = 가는 곳, I-16 7 · I-11 6).
 * ds Button ghost small flush(왼쪽) · neutralSubtle + 꺾쇠 14, 라우터 Link 라 누르면 기록을 남기고(push)
 * 새 탭 · 가운데 클릭도 산다. 떠나기 전에 묻는 화면은 `onClick` 에서 가로챈다(설정 틀의 금액 가리기).
 * 제목 줄(PageHead) 바로 위에 두고, 단추 ↔ 제목 줄 사이는 둘러싼 화면이 정한다.
 */
export function ParentLink({
  to,
  label,
  onClick,
}: {
  to: string;
  label: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      size="small"
      flush="left"
      ghostColor="neutralSubtle"
    >
      <Link to={to} onClick={onClick}>
        <ChevronLeft aria-hidden />
        {label}
      </Link>
    </Button>
  );
}
