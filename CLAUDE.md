# Porest Desk Front — 작업 규칙

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

## 작업 흐름 (요약)

```
1. 작업할 컴포넌트/화면 파악
2. porest-design/specs/components/<name>.md (또는 DESIGN.*.md) 확인 — SoT
3. spec과 현재 코드 diff
4. spec 부재 / 모호 → 사용자에게 결정 요구 (현재 + spec 인용 + 선택지)
5. 결정 → spec 업데이트 (필요 시) → 코드 동기
6. lint + 시각 검증 (storybook / 화면)
7. 반복
```

## 참고

- 토큰 / 시스템 워크플로: `porest-design/CLAUDE.md`
- 컴포넌트 spec 작업: `porest-design/specs/CLAUDE.md`
- Git 컨벤션: `porest-design/GIT_CONVENTION.md`
- spec 일람: `porest-design/specs/components/*.md`
- DESIGN prose: `porest-design/DESIGN.md` (공유) / `DESIGN.desk.md` (Desk 전용)
