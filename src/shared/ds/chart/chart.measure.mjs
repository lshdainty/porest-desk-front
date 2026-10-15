// Chart 를 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// [요소, 재는 법, CSS 속성, { skipIf }] — 형식은 검사기 머리 주석.
//
// 견본의 첫 요소(root)는 부품마다 다르다 — 차트 상자(Chart) · 열지도 · 지표 타일 묶음 · 도넛 범례 · 툴팁을 감싼 상자. 키는 모두 선택자로 잰다
// (그 견본에 없는 부분은 재지 않는다). 올림 · 누름 · 키보드 초점은 root 에 걸린다 — 호버 견본은 차트 상자(가리킴 선 · 툴팁이 뜬다) · 끈 지표 타일 ·
// 도넛 범례의 누르는 줄, 초점 견본은 초점을 받는 차트 상자 · 열지도다.
//
// 재지 않는 것(문장 · 그림 · 모션 · 그림자라 chart.test.tsx 가 맡는다)
//   - root.width · background · height   "100%" · "transparent" · "쓰는 자리가 정한다" 는 문장이다 — 테스트가 클래스를 본다
//   - tickLabel.typography   SVG 글자는 줄 높이가 "normal" 이라 15 와 비교되지 않는다 — 크기 11 · 색은 chartAxisProps 의 값이고 테스트가 맡는다.
//     색(tickLabel.foreground)은 SVG 의 fill 로 잰다
//   - gridLine.borderStyle · crosshair.borderStyle   "dashed" — SVG 는 stroke-dasharray "3 3" 이다(계산값 "3px, 3px"), 테스트가 맡는다
//   - series.color "chart-{색}" · 이중 축 눈금 색 "chart-{계열 색}" · legendTile.background "chart-{색}-subtle"   문장이다 — 색 이름 하나가 정해진 견본(palette)이 잰다
//   - point.size(10)   가리킨 점은 r 4 + 테두리 2 인 SVG 원이다(ACTIVE_DOT) — 테스트가 맡는다
//   - tooltip.shadow · zIndex   그림자 계산값은 색이 앞에 오는 글이고 z 200 은 열지도 툴팁 층(포털)의 값이다 — 테스트가 클래스를 본다.
//     차트 상자 안 툴팁은 상자 안 겹침(1)이다
//   - legendTile.touchTarget · transition*(속성 · 시간 · 곡선)   문장이다 — 테스트가 클래스를 본다. pressed.scale 도 같다
//   - legendTile.borderWidth · borderColor(끈 타일)   안쪽 1px 은 inset box-shadow 다 — 계산된 box-shadow 는 색이 앞에 오는 글이다
//   - legendList.background(hovered · pressed) 는 알약 요소(chart-donut-pill)의 배경으로 잰다 — 쉴 때 값은 스펙에 없다
//   - donutCenter.typography 의 줄 높이는 잰다, 도넛 두께(series.thickness 22)는 recharts 가 SVG 로 그린다 — 테스트가 innerRadius 를 맞춘다
//   - bar.maxWidth · radius · gap · line.strokeWidth(Area 곡선은 잰다)   막대는 SVG 경로다 — 테스트가 계열 기본값을 본다
//   - heatmapCell.background "bg-brand-solid 18 · 35 · …"   단계마다 color-mix 라 문장이다 — 테스트가 단계 경계 · 클래스를 본다
//   - heatmapValue.threshold · foreground   칸 폭 임계는 테스트가, 글자색은 단계마다 정해 CSS 변수로 쓴다 — 테스트가 맡는다
//   - 그려짐(300ms) · 타일 누름 모션   시간은 문장이다 — 테스트가 맡는다
const TICK = ".recharts-cartesian-axis-tick-value";
const TIP = "[data-slot=chart-tooltip]";
const ROW = "[data-slot=chart-tooltip-row]";
const TILE = "[data-slot=chart-legend-tile]";
const DROW = "[data-slot=chart-donut-row]";
const CELL = "[data-slot=chart-heatmap-cell]";

export default {
  // 눈금 · 격자 · 가리킴
  "tickLabel.foreground": [TICK, "color", "fill"],
  "tickLabel.numerals": [TICK, "exact", "font-variant-numeric"],
  "gridLine.borderWidth": [
    ".recharts-cartesian-grid-horizontal line",
    "px",
    "stroke-width",
  ],
  "gridLine.borderColor": [
    ".recharts-cartesian-grid-horizontal line",
    "color",
    "stroke",
  ],
  "crosshair.borderWidth": [
    "[data-slot=chart-crosshair]",
    "px",
    "stroke-width",
  ],
  "crosshair.borderColor": ["[data-slot=chart-crosshair]", "color", "stroke"],
  "line.strokeWidth": [".recharts-area-curve", "px", "stroke-width"],

  // 툴팁(떠 있는 표면)
  "tooltip.minWidth": [TIP, "px", "min-width"],
  "tooltip.paddingY": [TIP, "px", "padding-top"],
  "tooltip.paddingX": [TIP, "px", "padding-left"],
  "tooltip.radius": [TIP, "px", "border-top-left-radius"],
  "tooltip.background": [TIP, "color", "background-color"],
  "tooltip.gap": [TIP, "px", "row-gap"],
  "tooltipHead.typography": ["[data-slot=chart-tooltip-head]", "typography"],
  "tooltipHead.foreground": [
    "[data-slot=chart-tooltip-head]",
    "color",
    "color",
  ],
  "tooltipRow.typography": [ROW, "typography"],
  "tooltipRow.foreground": [
    "[data-slot=chart-tooltip-label]",
    "color",
    "color",
  ],
  "tooltipRow.gap": [ROW, "px", "column-gap"],
  "swatch.size": ["[data-slot=chart-tooltip-swatch]", "px", "width"],
  "swatch.radius": [
    "[data-slot=chart-tooltip-swatch]",
    "px",
    "border-top-left-radius",
  ],

  // 지표 타일
  "legendTile.radius": [TILE, "px", "border-top-left-radius"],
  "legendTile.paddingY": [TILE, "px", "padding-top"],
  "legendTile.paddingX": [TILE, "px", "padding-left"],
  "legendTile.gap": ["[data-slot=chart-legend-list]", "px", "column-gap"],
  "legendTile.typography": ["[data-slot=chart-legend-name]", "typography"],
  "legendTile.foreground": ["[data-slot=chart-legend-name]", "color", "color"],
  "legendTile.cursor": [TILE, "exact", "cursor"],
  "legendTile.background": [TILE, "color", "background-color"],
  "series.color": ["[data-slot=chart-legend-dot]", "color", "background-color"],

  // 도넛 범례 · 가운데
  "legendList.minHeight": [DROW, "px", "min-height"],
  "legendList.typography": [DROW, "typography"],
  "legendList.gap": [DROW, "px", "column-gap"],
  "legendList.background": [
    "[data-slot=chart-donut-pill]",
    "color",
    "background-color",
  ],
  "donutCenter.typography": [
    "[data-slot=chart-donut-center-amount]",
    "typography",
  ],
  "donutCenter.fontWeight": [
    "[data-slot=chart-donut-center-amount]",
    "exact",
    "font-weight",
  ],
  "donutCenter.foreground": [
    "[data-slot=chart-donut-center-amount]",
    "color",
    "color",
  ],
  "donutCenter.numerals": [
    "[data-slot=chart-donut-center-amount]",
    "exact",
    "font-variant-numeric",
  ],

  // 열지도
  "heatmapCell.aspectRatio": [CELL, "exact", "aspect-ratio"],
  "heatmapCell.radius": [CELL, "px", "border-top-left-radius"],
  "heatmapCell.gap": ["root", "px", "column-gap"],
  "heatmapValue.typography": [CELL, "typography"],
  "heatmapValue.fontWeight": [CELL, "exact", "font-weight"],
  "heatmapValue.numerals": [CELL, "exact", "font-variant-numeric"],

  // 키보드 초점 링 — 초점을 받는 상자(차트 · 열지도)가 root 인 견본에서
  "focusRing.width": ["root", "px", "outline-width"],
  "focusRing.offset": ["root", "px", "outline-offset"],
  "focusRing.color": ["root", "color", "outline-color"],
};
