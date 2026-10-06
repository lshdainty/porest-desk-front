#!/usr/bin/env node
/**
 * porest-design 이 내보내는 파일을 이 레포로 가져온다 — 손으로 고치지 않는다.
 *
 *   src/shared/styles/porest-tokens.css ← scripts/build-tailwind-v4.mjs (DESIGN.desk.md, 다크 블록 포함)
 *   src/shared/ds/spec/*.json            ← scripts/build-spec-json.mjs  (컴포넌트 스펙 값, 라이트 · 다크)
 *
 * porest-design 은 옆 폴더(../porest-design)라고 본다. 다르면 PORESTDESIGN_DIR 로 알려 준다.
 * 가져온 뒤 prettier 로 서식만 맞춘다 — CI 의 format:check 가 이 파일들도 본다.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESIGN = resolve(
  ROOT,
  process.env.PORESTDESIGN_DIR ?? "../porest-design",
);
const SOURCE = "DESIGN.desk.md";

if (!existsSync(resolve(DESIGN, SOURCE))) {
  console.error(`porest-design 을 찾지 못했다: ${DESIGN}`);
  process.exit(1);
}

// 원본 경로가 머리 주석에 그대로 찍히므로 porest-design 안에서 상대 경로로 돌린다
const css = execFileSync(
  "node",
  ["scripts/build-tailwind-v4.mjs", "--source", SOURCE],
  { cwd: DESIGN, encoding: "utf8" },
);
writeFileSync(resolve(ROOT, "src/shared/styles/porest-tokens.css"), css);

const specDir = resolve(ROOT, "src/shared/ds/spec");
rmSync(specDir, { recursive: true, force: true });
mkdirSync(specDir, { recursive: true });
execFileSync(
  "node",
  ["scripts/build-spec-json.mjs", "--source", SOURCE, "--out", specDir],
  { cwd: DESIGN, stdio: "inherit" },
);

execFileSync(
  "npx",
  [
    "prettier",
    "--write",
    "--log-level",
    "warn",
    "src/shared/styles/porest-tokens.css",
    "src/shared/ds/spec",
  ],
  { cwd: ROOT, stdio: "inherit" },
);

console.log(
  `porest-design(${SOURCE}) → porest-tokens.css · src/shared/ds/spec`,
);
