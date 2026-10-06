# Porest Desk Front — 작업 규칙

> **워크스페이스 공통 규칙**(Git 작업 격리 · 스테이징 범위 · 태그·릴리스)은
> 상위 `/home/lshdainty/study/CLAUDE.md` 에 있다. Claude Code 가 디렉토리 워크업으로
> 자동 로드하므로 여기에 복사하지 않는다 — 복사본은 원문이 바뀌어도 따라오지 않는다.

## WHY (목적)

`porest-design`의 디자인 시스템 spec을 **단일 source of truth(SoT)** 으로 두고, desk-front 코드를 그 spec에 정확히 맞추기 위한 작업 규칙. spec 정합이 어긋나면 사용자 화면이 어긋나 작업이 빙빙 돌게 됨 — 그걸 사전에 막는다.

## WHAT (산출물)

`porest-design`에 정의된 디자인 시스템을 React/TS로 구현한 클라이언트:
- `src/shared/ds/<name>/` — **새 컴포넌트 라이브러리**(2026-10-06~). porest-design 에서 SEED 와 비교해 확정한
  스펙(사이트에 그림 페이지가 있는 42개)만 만든다. 레시피(`recipes/shadcn/components/ui/<name>.tsx`)를 첫 판으로
  가져와 이 레포 규칙(경로 · 파일 나누기 · 손 메모이제이션 없음)에 맞춘다. 폴더 하나에 `<name>.tsx`(컴포넌트만 —
  빠른 새로 고침) · `<name>-variants.ts`(cva) · `<name>.demo.tsx`(카탈로그 견본) · `<name>.test.tsx`(동작) ·
  `index.ts`(내보내기)를 둔다. 만든 것은 개발 전용 카탈로그 `/dev/ds`(`src/shared/ds/catalog`)에서 라이트 · 다크로 본다.
- **스펙대로인지는 `npm run ds:check` 가 잰다** — 카탈로그를 크로미움에 띄워 견본(`Specimen`)마다 스펙 값
  (`src/shared/ds/spec/*.json`)을 풀고 계산된 스타일과 맞춘다. 올림 · 누름 · 키보드 포커스는 실제로 해서 잰다.
  컴포넌트를 만들면 견본과 검사기의 `MEASURE`(무엇을 어느 CSS 로 재나)를 같이 단다. Playwright 크로미움이
  필요하다(처음 한 번 `npx playwright install chromium`). 아직 CI 에는 없다 — 커밋 전에 돌린다.
- `src/shared/ui/<name>.tsx` — **옛 컴포넌트**. 화면을 하나씩 `shared/ds` 로 옮기는 동안만 남는다 — 새로 쓰지 않는다.
  옮기는 순서는 "먼저 라이브러리를 다 만들고, 화면은 나중에 화면 단위로" 다.
- `src/shared/styles/porest-tokens.css` · `src/shared/ds/spec/*.json` — porest-design 이 내보낸 파일. **손으로 고치지
  않는다** — `npm run design:sync`(옆 폴더 `../porest-design`, 다르면 `PORESTDESIGN_DIR`)로 다시 가져온다.
  토큰 CSS 는 다크 블록을 포함한다 — 역할 색(`--color-fg-neutral` …)이 라이트 · 다크를 스스로 따라간다.
- `src/index.css` — 옛 로컬 이름(`--fg-primary` · `--bg-canvas` …)을 DESIGN.md v102 표대로 역할 색에 잇는다.
  새 코드는 역할 이름(`text-fg-neutral` · `bg-bg-brand-solid` …)을 쓴다.
- `src/pages/**/*.tsx` / `src/features/**/*.tsx` — 위 컴포넌트를 사용한 화면 — spec 위반 inline override 금지

### 화면 폭 — 옛 화면은 지금 값으로 고정(2026-10-06)

토큰의 중단점이 SEED 값이 됐다(`sm` 480 · `md` 768 · `lg` 1280 · `xl` 1440). 옛 화면의 반응형 클래스는
겉모습이 바뀌지 않게 옛 값(640 · 736 · 834 · 1069)을 적어 고정했다 — `min-[834px]:` 처럼 보이는 것이 그것이다.
화면을 옮길 때 새 이름(`md:` · `lg:`)으로 바꾼다. **새 코드는 이름 있는 중단점만 쓴다.** 시트 ↔ 대화상자 ·
Menu Sheet ↔ Menu · 칸 52 ↔ 40 은 스펙대로 1280 에서 바뀐다. 셸(모바일 ↔ 사이드바)은 지금처럼 768 이다.

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
  - `<Button className="rounded-[var(--radius-tile)]">` ❌ (Button spec은 크기마다 모서리가 정해져 있다 — 8 · 12 · 알약)
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
44/28 로 동일했다.

**`npm run lint` 는 에러 0 · 경고 0 이고 CI 가 `--max-warnings 0` 으로 막는다.**
경고를 세는 게 핵심이다 — 안 세면 CI 가 안 깨지므로 조용히 쌓인다(실제로 28 개까지 갔다).
새 지적이 나오면 끄지 말고 고쳐라. `eslint-disable` 은 그 줄만 조용하게 만드는 게 아니라
**React Compiler 가 그 함수를 통째로 건너뛰게** 한다.

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

## React Compiler 가 켜져 있다

`useMemo`/`useCallback` 을 손으로 달지 마라 — 컴파일러가 판단한다. 892 곳 중 841 곳
(94%)에 적용된다. 비용은 첫 화면이 아니라 라우트에 붙는다(초기 로딩 +1 KB, 라우트당
+4.5~17 KB gzip). 수치 근거는 `vite.config.ts` 주석에 있다.

포기(bailout)하는 자리가 51 곳 있고, 그중 **우리가 만든 게 31 곳**이다.

- **`eslint-disable` 를 달면 그 파일을 통째로 건너뛴다**(18 곳). React 규칙을 끈 코드는
  컴파일러가 안전을 보장할 수 없어서다. 주석 한 줄이 그 파일의 최적화를 전부 날린다 —
  달기 전에 정말 필요한지 본다.
- `preserve-manual-memoization` 이 뜨는 자리(13 곳)는 수동 메모이제이션을 컴파일러가
  보존하지 못하는 형태다. 고치면 그만큼 최적화가 돌아온다.
- 나머지 20 곳은 컴파일러 한계(try/catch 처리 등)라 우리가 할 게 없다.

**테스트는 컴파일 안 된 코드를 돈다** — `vitest.config.ts` 는 `vite.config.ts` 를 쓰지
않는다. 컴파일러가 끼어들어 생기는 동작 차이는 `npm test` 로 안 잡힌다.

## 테스트는 vitest 로 돌린다

`npm test` (= `vitest run`). CI 가 빌드보다 먼저 돌린다. 테스트 파일은 `*.test.ts(x)`.

## 참고

- 토큰 / 시스템 워크플로: `porest-design/CLAUDE.md`
- 컴포넌트 spec 작업: `porest-design/specs/CLAUDE.md`
- Git 컨벤션: `porest-design/GIT_CONVENTION.md`
- spec 일람: `porest-design/specs/components/*.md`
- DESIGN prose: `porest-design/DESIGN.md` (공유) / `DESIGN.desk.md` (Desk 전용)
