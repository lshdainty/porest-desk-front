# Porest Desk Front — 작업 규칙

> **워크스페이스 공통 규칙**(Git 작업 격리 · 스테이징 범위 · 태그·릴리스)은
> 상위 `/home/lshdainty/study/CLAUDE.md` 에 있다. Claude Code 가 디렉토리 워크업으로
> 자동 로드하므로 여기에 복사하지 않는다 — 복사본은 원문이 바뀌어도 따라오지 않는다.

## WHY (목적)

`porest-design`의 디자인 시스템 spec을 **단일 source of truth(SoT)** 으로 두고, desk-front 코드를 그 spec에 정확히 맞추기 위한 작업 규칙. spec 정합이 어긋나면 사용자 화면이 어긋나 작업이 빙빙 돌게 됨 — 그걸 사전에 막는다.

## WHAT (산출물)

`porest-design`에 정의된 디자인 시스템을 React/TS로 구현한 클라이언트:
- `src/shared/ui/<name>.tsx` — porest-design `specs/components/<name>.md` SoT 미러
- `src/shared/styles/porest-tokens.css` / `src/index.css` — porest-design `exports/tokens.desk.css` 미러
- `src/pages/**/*.tsx` / `src/features/**/*.tsx` — 위 컴포넌트를 사용한 화면 — spec 위반 inline override 금지

## HOW (작업 규칙 — 절대 4 규칙)

### 1. 모든 컴포넌트는 porest-design spec 기준
- `src/shared/ui/<name>.tsx`는 `porest-design/specs/components/<name>.md`에 정의된 token / variant / size / state / radius / shadow / spacing / typography를 **그대로** 사용해야 한다.
- spec과 다르게 보이는 게 디자인적으로 더 좋아 보여도 임의 변경 금지.

### 2. spec에 없는 건 사용자에게 결정 요구
- 작업 중 spec에 정의되지 않은 토큰 / 변형 / 규칙이 필요할 때:
  1. **현재 상황** (어떤 화면에서 어떤 토큰이 필요한지)
  2. **spec 인용** (현재 spec이 명시하는 값 + 누락 부분)
  3. **선택지** (A: spec 그대로 유지 / B: spec에 신규 추가 / C: 기존 토큰 재사용 …)

   를 정리해 사용자에게 보여주고 **결정을 요구**한다. 임의 결정 금지.

### 3. spec 업데이트 → 컴포넌트 수정 순서
- 사용자가 신규 spec 추가/수정을 결정하면:
  1. **`porest-design/specs/components/<name>.md` 또는 `DESIGN.*.md`를 먼저** 수정 (SoT 갱신)
  2. 그 다음 desk-front의 `<name>.tsx` / 사용처를 동기
  3. desk-app(Flutter)도 같은 spec을 미러하므로 함께 정합 (별도 PR 가능)

   spec 없이 코드부터 바꾸지 않는다.

### 4. 반복
- 새로 발견된 위반 또는 누락이 있으면 (1)→(2)→(3) 반복. spec ↔ 코드 일치가 영구 게이트.

## 금지 사항

- **컴포넌트 사용 시 inline `className`/`style`로 spec 토큰을 override 금지** — 예:
  - `<Button className="rounded-[var(--radius-tile)]">` ❌ (Button spec은 `radius-sm` 4px 고정)
  - `<Input className="h-12">` ❌ (Input spec sizes 표 외 값 금지)
  - 정당한 inline은 spec 외 영역 (layout, position, gap, margin)만.

- **porest-design 표준이 아닌 custom 토큰을 spec 영역에 사용 금지** — 예:
  - `--radius-tile`(10px, desk-front custom)을 button container에 사용 ❌
  - custom 토큰은 spec 외 컨테이너(예: dashboard hero, expense row card)에만 허용.

- **`shared/ui/` 외부에 raw HTML/JSX로 컴포넌트 복제 금지** — `<button>` / `<input>` / `<select>` 직접 사용 금지. 반드시 `shared/ui/<name>` 통과.

- **신규 화면 작성 시 shared 컴포넌트의 시각을 자체 `<div>` + inline `style` 로 모방 금지** — Card/Chip/Button/Input/Tabs 등의 시각 (bg + border + radius + shadow 조합) 이 필요하면 **반드시 `<Card>` / `<Chip>` / `<Button>` / `<Input>` / `<Tabs>` 등 shared 컴포넌트 사용**. 자체 `<button>/<div>` + inline style 로 비슷한 시각을 직조하면 spec 변경 시 누락 발생 + SoT 단일성 깨짐.
  - 예 ❌: `<button style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>` — Card(bordered) 모방
  - 예 ✓: `<Card variant="bordered" onClick={...}>` 또는 `<Card>` + 안의 `<Button>` — SoT 사용
  - shared 컴포넌트에 필요한 variant/prop 이 부족하면 spec 변경 + shared 컴포넌트 확장 (HOW 절차 1→2→3).

## i18n 은 CSV 가 SoT — `src/locales/` 에 쓰지 마라

번역 원본은 **`i18n/translations.csv`** 하나다. `src/locales/**` 는
`npm run i18n:generate`(= `scripts/generate-i18n.mjs`)가 CSV 를 읽어 만드는 **생성물**이고
`.gitignore:48` 이 통째로 제외한다.

`src/locales/ko/*.json` 에 키를 넣으면 **다음 generate 에 조용히 날아간다.** 파일이 눈앞에
있고 편집도 되니 되는 것처럼 보이는데, 커밋에는 안 들어가고 값만 사라진다.

```
i18n/translations.csv          ← 여기에 넣는다 (namespace,key,ko,en)
npm run i18n:generate          ← 그 다음 생성
```

**키를 추가했으면 실제로 생성됐는지 확인한다** — `tsc` 는 i18n 키 누락을 못 잡는다.
문자열이라 타입이 통과한다. 화면에서 키 이름이 그대로 보이고 나서야 안다.

```bash
python3 -c "import json,io;d=json.load(io.open('src/locales/ko/<ns>.json'));print('<key>' in d)"
```

## SwipeActions 쓸 때

- **`SwipeActionsProvider` 안에서만 동작한다.** AppLayout 모바일 두 셸(`.m-scroll`)에 하나씩
  있고, 화면마다 새로 두지 않는다 — '한 번에 한 행'·'스크롤하면 닫힘' 이 거기 붙어 있다.
  앱이 화면마다 컨테이너를 두다 붙이는 걸 빠뜨려 여러 행이 열린 채 남는 버그를 겪고 루트
  하나로 옮겼다.
- **`enabled` 는 데스크톱 통과 전용이다**(spec Platform). 행 단위로 액션이 성립하지 않는
  경우(시스템 생성 거래 등)는 `actions={[]}` 로 거른다 — 두 의미를 한 prop 에 겹쳐 담으면
  둘 중 하나를 표현하지 못한다.
- **행에 편집 버튼이 이미 보이는 곳에는 붙이지 않는다** — 같은 일을 두 방법으로 하게 된다.
  기준은 화면 종류가 아니라 그 행의 모습이다. 데스크톱 관리 행은 연필·휴지통이 보이니 붙이지
  않고(`enabled={mobile}` 로 통과), 모바일 관리 행은 셰브론뿐이라 붙인다 — 계좌·카드 관리가
  그렇게 갔다. 예전엔 spec 이 "관리형 화면" 을 통째로 막았는데 그 줄은 걷어냈다
  (porest-design#13).

## 작업 흐름 (요약)

```
1. 작업할 컴포넌트/화면 파악
2. porest-design/specs/components/<name>.md (또는 DESIGN.*.md) 확인 — SoT
3. spec과 현재 코드 diff
4. spec 부재 / 모호 → 사용자에게 결정 요구 (현재 + spec 인용 + 선택지)
5. 결정 → spec 업데이트 (필요 시) → 코드 동기
6. `npm run format` → `npx tsc --noEmit -p tsconfig.app.json` → `npm test` + 시각 검증
7. 반복
```

## 서식은 prettier 가 정한다

**설정은 기본값이다.** `prettier.config.js` 가 비어 있는 건 빠뜨린 게 아니라 결정이다 —
서식은 논쟁거리가 아니라 정해 두고 잊는 것이라, gofmt·`dart format` 처럼 도구 의견을
그대로 받는다. 기본값이면 "왜 이 값인가" 를 설명할 일이 없다.

기본값이 정하는 것 중 눈에 띄는 셋: 세미콜론을 **붙이고**(`semi`), **큰따옴표**를 쓰고
(`singleQuote: false`), 폭은 **80** 이다.

**커밋 전에 `npm run format` 을 돌려라.** CI(`ci-main`)가 `npm run format:check` 로 막는다.

- 제외 대상은 `.prettierignore` — i18n 생성물(`src/locales`)과 **마크다운**.
  `CLAUDE.md`·`README` 는 손으로 줄을 맞춘 한국어 산문이라 prettier 가 문단을 다시
  흘리면 의도한 줄바꿈이 깨진다. 코드 서식을 통일하려는 것이지 문서를 다시 쓰려는 게 아니다.
- 서식만 바꾼 대규모 커밋은 `.git-blame-ignore-revs` 에 적는다.
  로컬 blame 에도 먹이려면 한 번만: `git config blame.ignoreRevsFile .git-blame-ignore-revs`
- **레포 전체를 건드리는 서식 커밋은 최신 main 에서 파고 바로 머지한다.** 오래 들고
  있으면 그 사이 머지된 PR 과 통째로 충돌한다(앱에서 실제로 겪었다).

eslint 는 서식이 아니라 **의미**를 본다(`exhaustive-deps` 등). prettier 와 역할이 겹치지
않아 `eslint-config-prettier` 는 필요 없다 — 실제로 전면 적용 전후 eslint 지적 수가
44/28 로 동일했다. `npm run lint` 전체는 아직 CI 에 없고 현재 실패한다(정리 중).

## FSD 계층은 CI 가 막는다

임포트는 **아래로만** 간다.

    app → pages → widgets → features → entities → shared

`npm run lint:fsd` 가 이것만 검사하고 CI(`ci-main`)가 막는다. 전체 lint 를 못 거는
동안에도 계층은 잠가 둔다 — 규칙이 없으면 조용히 다시 쌓인다(실제로 11 건까지 갔다).

- 정의는 **`eslint.fsd.js` 한 곳**이다. `eslint.config.js`(에디터)와
  `eslint.fsd.config.js`(CI)가 둘 다 여기서 가져간다.
- 같은 계층끼리(features → 다른 features)는 아직 막지 않는다. 30 건이 남아 있다.
- **`import/resolver` 를 지우지 마라.** 이게 없으면 `@/` 별칭과 `.ts` 확장자를 못 풀어
  모든 임포트가 외부 패키지로 분류되고, 위반을 심어 놔도 **초록불이 난다.**
  `tests/fsd-boundaries.test.ts` 가 그 상태를 잡으려고 있는 테스트다.

## 테스트는 vitest 로 돌린다

`npm test` (= `vitest run`). CI 가 빌드보다 먼저 돌린다. 테스트 파일은 `*.test.ts(x)`.

## 참고

- 토큰 / 시스템 워크플로: `porest-design/CLAUDE.md`
- 컴포넌트 spec 작업: `porest-design/specs/CLAUDE.md`
- Git 컨벤션: `porest-design/GIT_CONVENTION.md`
- spec 일람: `porest-design/specs/components/*.md`
- DESIGN prose: `porest-design/DESIGN.md` (공유) / `DESIGN.desk.md` (Desk 전용)
