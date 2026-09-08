export interface Memo {
  rowId: number;
  title: string;
  content: string | null;
  /**
   * 붙어 있는 태그의 이름. `null` 이면 태그 없음이다.
   *
   * 종전 주석이 "에디터 select 7종" 을 못 박고 있었는데 그 7종은 화면 하드코딩이었다.
   * 이제 목록은 서버 마스터(`GET /memo-tags`)가 준다 — 여기 오는 값은 그 마스터의 이름이고,
   * 저장할 때 이 문자열을 그대로 보내면 서버가 같은 이름의 마스터를 찾거나 만들어 잇는다.
   */
  tag: string | null;
  /**
   * 이 메모가 가리키는 태그 마스터의 아이디 — 태그가 없으면 `null`.
   *
   * 화면은 아직 이름(`tag`)으로 그린다. 이 값을 들고 있는 건 개명·삭제가 이름을 옮기거나
   * 비웠을 때 어느 행이었는지가 남아 있어야 하기 때문이다(정체성은 `rowId` 하나).
   */
  memoTagRowId?: number | null;
  /** chart palette base hex (예: '#2c70bf'). null 이면 blue 취급. */
  color: string | null;
  isPinned: boolean;
  createAt: string;
  modifyAt: string;
}

export interface MemoFormValues {
  title: string;
  content?: string;
  /**
   * 태그 이름. `null` 을 실으면 태그를 뗀다 — 서버가 `memo.tag` 문자열과 마스터 FK 를
   * 함께 비운다(한쪽만 끊으면 다음 저장에서 나머지 한쪽이 되살린다, QA #88).
   */
  tag?: string | null;
  /** chart palette base hex — 기본값 blue('#2c70bf'). */
  color?: string | null;
}
