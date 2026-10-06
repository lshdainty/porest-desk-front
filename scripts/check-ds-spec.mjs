#!/usr/bin/env node
/**
 * 새 컴포넌트(src/shared/ds)가 스펙 값(src/shared/ds/spec/*.json)대로 그려지는지 크로미움에서 잰다.
 *
 * 개발 서버로 카탈로그(/dev/ds)를 띄우고, 데모가 [data-spec] 으로 표시한 견본마다
 *   1. 조합(data-combo)과 상태(data-state)로 스펙 규칙을 푼다 — when 이 맞는 규칙의 enabled 를 차례로
 *      겹치고, 그 위에 그 상태의 값을 겹친다(사이트 · 앱 테스트와 같은 방식).
 *   2. 견본이 놓인 판(라이트 · 다크)의 값을 고른다.
 *   3. 계산된 스타일을 읽어 맞춘다. hovered · pressed · focused 는 실제로 올리고 · 누르고 · 탭해서 잰다.
 * 무엇을 어느 CSS 로 재는지는 컴포넌트 폴더의 <이름>.measure.mjs 에 적는다 — 적지 않은 값(커서 · 모션 ·
 * 문장으로 된 값)은 재지 않는다. 컴포넌트를 더할 때 이 파일은 고치지 않는다.
 *
 * 사용: npm run ds:check            (모든 컴포넌트)
 *       npm run ds:check -- button  (이름을 주면 그것만)
 * Playwright 의 Chromium 이 필요하다 — 처음 한 번 `npx playwright install chromium`.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const only = process.argv.slice(2);

// ── 스펙 풀기 ──────────────────────────────────────────────

const loadSpec = (name) =>
  JSON.parse(
    readFileSync(resolve(ROOT, `src/shared/ds/spec/${name}.json`), "utf8"),
  );

/** 조합 · 상태의 값 — { "root.height": 40, … }. enabled 를 먼저 다 겹치고 그 상태를 겹친다. */
function resolveState(spec, combo, state) {
  const full = { ...spec.defaults, ...combo };
  const base = spec.states[0];
  const rules = spec.rules.filter((r) =>
    Object.entries(r.when).every(([k, v]) => full[k] === v),
  );
  const out = {};
  for (const s of state === base ? [base] : [base, state]) {
    for (const r of rules) {
      for (const [slot, props] of Object.entries(r[s] ?? {})) {
        for (const [p, v] of Object.entries(props)) out[`${slot}.${p}`] = v;
      }
    }
  }
  return out;
}

/** 모드 값 — { light, dark } 면 그 모드, 아니면 그대로 */
const pick = (v, mode) =>
  v && typeof v === "object" && "light" in v && "dark" in v ? v[mode] : v;

// ── 값 맞추기 ──────────────────────────────────────────────

/** "#RRGGBB(AA)" · "transparent" · "rgb(…)" · "color(srgb …)" → [r, g, b, a] */
function parseColor(s) {
  if (s === "transparent") return [0, 0, 0, 0];
  let m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s);
  if (m) {
    const n = parseInt(m[1], 16);
    return [
      n >> 16,
      (n >> 8) & 255,
      n & 255,
      m[2] ? parseInt(m[2], 16) / 255 : 1,
    ];
  }
  m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) {
    const p = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  m = /^color\(srgb ([^)]+)\)$/.exec(s);
  if (m) {
    const p = m[1]
      .split(/[\s/]+/)
      .filter(Boolean)
      .map(Number);
    return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1];
  }
  return null;
}

function sameColor(expected, actual) {
  const e = parseColor(expected);
  const a = parseColor(actual);
  if (!e || !a) return false;
  // 완전히 투명하면 색은 상관없다
  if (e[3] === 0 && a[3] === 0) return true;
  return (
    e.slice(0, 3).every((x, i) => Math.abs(x - a[i]) <= 1.5) &&
    Math.abs(e[3] - a[3]) <= 0.01
  );
}

const samePx = (expected, actual) =>
  Math.abs(Number(expected) - parseFloat(actual)) <= 0.5;

// ── 컴포넌트마다 무엇을 어디서 재나 ──────────────────────────
//
// src/shared/ds/<이름>/<이름>.measure.mjs 의 default — 키는 "슬롯.속성"(스펙 JSON 의 이름),
// 값은 [요소, 재는 법, CSS 속성, { skipIf }].
//   요소     "root"(견본 자체) 또는 견본 안의 CSS 선택자. 그 견본에 없으면 재지 않는다.
//   재는 법  px(숫자 값을 그 속성의 px 로) · color · exact(글 그대로) · typography(글자 크기 · 줄 높이)
//   skipIf   그 조합 · 상태의 스펙에 이 키가 있으면 재지 않는다(다른 키가 같은 CSS 를 덮을 때)
const measures = {};
// 잴 자리 파일 — 보통 그 스펙 이름의 폴더에 있다. 한 폴더가 스펙 둘을 그리면(avatar 의 Avatar Stack) 그 폴더에
// <스펙>.measure.mjs 를 함께 둔다
async function measureFor(spec) {
  if (!(spec in measures)) {
    const own = resolve(ROOT, `src/shared/ds/${spec}/${spec}.measure.mjs`);
    const file = existsSync(own)
      ? own
      : readdirSync(resolve(ROOT, "src/shared/ds"))
          .map((dir) =>
            resolve(ROOT, `src/shared/ds/${dir}/${spec}.measure.mjs`),
          )
          .find((f) => existsSync(f));
    measures[spec] = file
      ? (await import(pathToFileURL(file).href)).default
      : null;
  }
  return measures[spec];
}

/** 스펙 값 하나를 재는 법 — [읽을 CSS 속성들, 비교]. 잴 수 없는 값(문장)이면 null */
function howToCompare(kind, prop, want) {
  switch (kind) {
    case "px":
      return typeof want === "number"
        ? [[prop], (v) => samePx(want, v[prop])]
        : null;
    case "color":
      return typeof want === "string" && parseColor(want)
        ? [[prop], (v) => sameColor(want, v[prop])]
        : null;
    case "exact":
      return [[prop], (v) => String(want) === v[prop]];
    case "typography":
      return want && typeof want === "object"
        ? [
            ["font-size", "line-height"],
            (v) =>
              samePx(want.fontSize, v["font-size"]) &&
              samePx(want.lineHeight, v["line-height"]),
          ]
        : null;
    default:
      throw new Error(`재는 법을 모른다: ${kind}`);
  }
}

// ── 재기 ───────────────────────────────────────────────────

const server = await createServer({
  root: ROOT,
  logLevel: "silent",
  // 재는 동안 다른 파일이 바뀌어도 페이지를 다시 불러오지 않는다(재던 견본이 사라진다)
  server: { port: 5290, strictPort: false, hmr: false },
});
await server.listen();
const url = new URL("dev/ds", server.resolvedUrls.local[0]).href;

const browser = await chromium.launch();
// 로케일을 정해 둔다 — LANG 이 없는 셸에서는 "en-US@posix" 가 되어 개발 도구가 Intl.Locale 에서 멈추고
// 앱이 그려지지 않는다
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  locale: "ko-KR",
});
await page.goto(url, { waitUntil: "networkidle" });
// 네트워크가 멎어도 카탈로그(견본 수백 개)는 아직 그리는 중일 수 있다 — 견본이 생기고, 그 수가 더 늘지 않을 때까지
await page.waitForSelector("[data-spec]", { timeout: 60_000 });
for (let last = -1; ;) {
  const count = await page.locator("[data-spec]").count();
  if (count === last) break;
  last = count;
  await page.waitForTimeout(500);
}

let failed = 0;
let checked = 0;
const specs = {};

const specimens = await page.$$("[data-spec]");
for (const handle of specimens) {
  const info = await handle.evaluate((el) => ({
    spec: el.dataset.spec,
    combo: JSON.parse(el.dataset.combo ?? "{}"),
    state: el.dataset.state ?? "enabled",
    mode: el.closest("[data-theme=dark]") ? "dark" : "light",
  }));
  if (only.length && !only.includes(info.spec)) continue;
  const measure = await measureFor(info.spec);
  if (!measure) continue;
  specs[info.spec] ??= loadSpec(info.spec);
  const expected = resolveState(specs[info.spec], info.combo, info.state);

  // 견본의 첫 요소가 컴포넌트다(견본 틀은 display: contents)
  const root = await handle.evaluateHandle((el) => el.firstElementChild);
  // 상태 만들기 — 올리기 · 누르기 · 키보드 포커스
  if (info.state === "hovered") await root.hover();
  if (info.state === "pressed") {
    await root.hover();
    await page.mouse.down();
  }
  if (info.state === "focused") {
    await page.keyboard.press("Shift");
    await root.evaluate((el) => el.focus());
  }
  if (info.state !== "enabled") await page.waitForTimeout(400); // 색 · 축소 전환이 끝나게

  const label = `${info.spec} ${JSON.stringify(info.combo)} ${info.state} ${info.mode}`;
  for (const [key, raw] of Object.entries(expected)) {
    const how = measure[key];
    if (!how) continue;
    const want = pick(raw, info.mode);
    const [target, kind, cssProp, { skipIf } = {}] = how;
    if (skipIf && skipIf in expected) continue;
    const compare = howToCompare(kind, cssProp, want);
    if (!compare) continue; // 문장으로 된 값(부품이 정함 …)
    const [props, cmp] = compare;
    const actual = await root.evaluate(
      (el, { target, props }) => {
        const node = target === "root" ? el : el.querySelector(target);
        if (!node) return null;
        const cs = getComputedStyle(node);
        return Object.fromEntries(
          props.map((p) => [p, cs.getPropertyValue(p)]),
        );
      },
      { target, props },
    );
    // 그 견본에 없는 부분(로딩이 아닐 때의 로딩 원, 아이콘 없는 버튼의 아이콘)은 재지 않는다
    if (actual === null) continue;
    checked++;
    if (!cmp(actual)) {
      failed++;
      console.log(
        `✗ ${label} — ${key}: 스펙 ${JSON.stringify(want)} · 실제 ${JSON.stringify(actual)}`,
      );
    }
  }

  if (info.state === "pressed") await page.mouse.up();
  if (info.state === "focused") await root.evaluate((el) => el.blur());
  if (info.state === "hovered" || info.state === "pressed") {
    await page.mouse.move(0, 0);
  }
}

await browser.close();
await server.close();

if (checked === 0) {
  console.log("잰 값이 없다 — 카탈로그 데모에 [data-spec] 견본이 있는지 본다");
  process.exit(1);
}
console.log(
  failed
    ? `\n${failed}/${checked} 값이 스펙과 다르다`
    : `${checked} 값이 스펙과 같다 (${Object.keys(specs).join(" · ")})`,
);
process.exit(failed ? 1 : 0);
