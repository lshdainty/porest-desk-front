/**
 * 메모 태그 마스터 — 설정에서 이름·색을 관리하고 메모 편집기가 그중 하나를 고른다.
 *
 * 할 일 태그(`TodoTag`)와 필드가 같다. 다른 점은 **매핑 테이블이 없다**는 것 하나로
 * (사용자 결정 2026-09-08 — 메모는 태그가 하나다), 그래서 `usageCount` 도 매핑이 아니라
 * `memo.memoTagRowId` FK 를 세어 온다. 화면에서 보이는 모양은 같다.
 */
export interface MemoTag {
  rowId: number;
  userRowId: number;
  tagName: string;
  color: string | null;
  createAt: string;
  modifyAt: string;
  /** 이 태그가 붙은 메모 수 — 서버 FK GROUP BY 집계(미배포 응답 대비 옵셔널). */
  usageCount?: number;
}

export interface MemoTagFormValues {
  tagName: string;
  color?: string;
}
