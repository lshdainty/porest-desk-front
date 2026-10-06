#!/usr/bin/env node
/**
 * 새 컴포넌트(src/shared/ds)가 스펙 값(src/shared/ds/spec/*.json)대로 그려지는지 크로미움에서 잰다.
 *
 * 개발 서버로 카탈로그(/dev/ds)를 띄우고, 데모가 [data-spec] 으로 표시한 견본마다
 *   1. 조합(data-combo)과 상태(data-state)로 스펙 규칙을 푼다 — when 이 맞는 규칙의 enabled 를 차례로
 *      겹치고, 그 위에 그 상태의 값을 겹친다(사이트 · 앱 테스트와 같은 방식).
 *   2. 견본이 놓인 판(라이트 · 다크)의 값을 고른다.
 *   3. 계산된 스타일을 읽어 맞춘다. hovered · pressed · focused 는 실제로 올리고 · 누르고 · 탭해서 잰다.
 * 무엇을 어느 CSS 로 재는지는 컴포넌트마다 MEASURE 에 적는다 — 적지 않은 값(커서 · 모션 · 문장으로 된 값)은
 * 재지 않는다.
 *
 * 사용: npm run ds:check            (모든 컴포넌트)
 *       npm run ds:check -- button  (이름을 주면 그것만)
 * Playwright 의 Chromium 이 필요하다 — 처음 한 번 `npx playwright install chromium`.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
// 키는 "슬롯.속성"(스펙 JSON 의 이름), 값은 [요소, 읽을 CSS 속성들, 비교].
// 요소: "root"(견본 자체) 또는 견본 안의 CSS 선택자. 비교는 (스펙 값, { 속성: 계산값 }) → 참 · 거짓.
// 넷째 칸(있으면)은 그 조합 · 상태의 스펙 값 전체를 받아 참이면 그 값을 재지 않는다.
const px = (prop) => [[prop], (e, v) => samePx(e, v[prop])];
const color = (prop) => [[prop], (e, v) => sameColor(e, v[prop])];
const exact = (prop) => [[prop], (e, v) => String(e) === v[prop]];
// 글자 — 크기 · 줄 높이만 잰다. 굵기는 컴포넌트가 따로 정한다(label.fontWeight)
const typography = [
  ["font-size", "line-height"],
  (e, v) =>
    samePx(e.fontSize, v["font-size"]) &&
    samePx(e.lineHeight, v["line-height"]),
];

const MEASURE = {
  "progress-circle": {
    "root.size": ["root", ...px("width")],
    "root.thickness": [
      "[data-slot=progress-circle-track]",
      ...px("stroke-width"),
    ],
    "root.track": ["[data-slot=progress-circle-track]", ...color("stroke")],
    "root.range": ["[data-slot=progress-circle-range]", ...color("stroke")],
    "range.linecap": [
      "[data-slot=progress-circle-range]",
      ...exact("stroke-linecap"),
    ],
  },
  button: {
    "root.height": ["root", ...px("height")],
    "root.width": ["root", ...px("width")],
    "root.radius": ["root", ...px("border-top-left-radius")],
    "root.background": ["root", ...color("background-color")],
    // 로딩에서는 label.color(투명)가 같은 CSS color 를 덮는다 — 그때는 그것을 잰다
    "root.foreground": ["root", ...color("color"), (e) => "label.color" in e],
    "root.borderColor": ["root", ...color("border-top-color")],
    "root.borderWidth": ["root", ...px("border-top-width")],
    "root.paddingX": ["root", ...px("padding-left")],
    "root.paddingY": ["root", ...px("padding-top")],
    "root.padding": ["root", ...px("padding-top")],
    "root.gap": ["root", ...px("column-gap")],
    "label.typography": ["root", ...typography],
    "label.fontWeight": ["root", ...exact("font-weight")],
    "label.color": ["root", ...color("color")],
    "prefixIcon.size": ["svg:not([data-slot])", ...px("width")],
    "suffixIcon.size": ["svg:not([data-slot])", ...px("width")],
    "icon.size": ["svg:not([data-slot])", ...px("width")],
    "progressCircle.size": ["[data-slot=progress-circle]", ...px("width")],
    "progressCircle.thickness": [
      "[data-slot=progress-circle-track]",
      ...px("stroke-width"),
    ],
    "progressCircle.track": [
      "[data-slot=progress-circle-track]",
      ...color("stroke"),
    ],
    "progressCircle.range": [
      "[data-slot=progress-circle-range]",
      ...color("stroke"),
    ],
    "focusRing.width": ["root", ...px("outline-width")],
    "focusRing.offset": ["root", ...px("outline-offset")],
    "focusRing.color": ["root", ...color("outline-color")],
  },
};

// ── 재기 ───────────────────────────────────────────────────

const server = await createServer({
  root: ROOT,
  logLevel: "silent",
  server: { port: 5290, strictPort: false },
});
await server.listen();
const url = new URL("dev/ds", server.resolvedUrls.local[0]).href;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle" });

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
  const measure = MEASURE[info.spec];
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
    if (typeof want === "string" && !/^(#|transparent|round)/.test(want)) {
      continue; // 문장으로 된 값(부품이 정함 …)
    }
    const [target, props, cmp, skip] = how;
    if (skip?.(expected)) continue;
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
    if (!cmp(want, actual)) {
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
