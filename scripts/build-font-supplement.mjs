#!/usr/bin/env node
/**
 * CDN Pretendard v1.3.9 dynamic-subset 의 unicode-range 에 빠진 기호(− ✓ ⚠ ∅ ↺ ⌘)를
 * Pretendard 원본(앱 번들 PretendardVariable.ttf, Version 1.309)에서 뽑아 public/fonts 에 만든다.
 * wght 축(45–930)은 그대로 둔다.
 *
 * SIL OFL 1.1 조항 3(Reserved Font Name) — 수정본(서브셋)은 "Pretendard" 이름을 쓸 수 없다.
 * 그래서 name 테이블의 Pretendard 가 든 이름(nameID 0·13·14 제외 전부, fvar 인스턴스 이름 포함)을 GrooNumSymbols 로 바꾼다.
 * 라이선스 전문: public/fonts/Pretendard-OFL.txt
 *
 * 실행: SUBSET_FONT_DIR=<subset-font 이 설치된 폴더> node scripts/build-font-supplement.mjs <PretendardVariable.ttf>
 * 글리프·이름을 바꾸면 src/index.css 의 @font-face(unicode-range · family) 도 같이 고친다.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(
  process.env.SUBSET_FONT_DIR
    ? `${process.env.SUBSET_FONT_DIR}/`
    : import.meta.url,
);
const subsetFont = require("subset-font");
const wawoff2 = require("wawoff2");

const TEXT = "−✓⚠∅↺⌘";
const NEW_NAME = "GrooNumSymbols";
// 저작권(0) · 라이선스(13 · 14) 문구는 원문 그대로 둔다. 나머지 이름(fvar 인스턴스 PostScript 이름 256+ 포함)은 모두 바꾼다.
const KEEP_IDS = new Set([0, 13, 14]);

const checksum = (b) => {
  let s = 0;
  const p = Buffer.concat([b, Buffer.alloc((4 - (b.length % 4)) % 4)]);
  for (let i = 0; i < p.length; i += 4) s = (s + p.readUInt32BE(i)) >>> 0;
  return s;
};

/** name 테이블(format 0/1)을 읽어 Pretendard → NEW_NAME 으로 바꿔 다시 쓴다. */
function renameTable(name) {
  const count = name.readUInt16BE(2);
  const strOff = name.readUInt16BE(4);
  const recs = [];
  for (let i = 0; i < count; i++) {
    const o = 6 + i * 12;
    const r = {
      pid: name.readUInt16BE(o),
      eid: name.readUInt16BE(o + 2),
      lid: name.readUInt16BE(o + 4),
      nid: name.readUInt16BE(o + 6),
    };
    const raw = name.subarray(
      strOff + name.readUInt16BE(o + 10),
      strOff + name.readUInt16BE(o + 10) + name.readUInt16BE(o + 8),
    );
    const utf16 = r.pid === 3 || r.pid === 0;
    let text = utf16
      ? Buffer.from(raw).swap16().toString("utf16le")
      : raw.toString("latin1");
    if (!KEEP_IDS.has(r.nid)) text = text.replace(/Pretendard/gi, NEW_NAME);
    r.buf = utf16
      ? Buffer.from(text, "utf16le").swap16()
      : Buffer.from(text, "latin1");
    recs.push(r);
  }
  recs.sort(
    (a, b) => a.pid - b.pid || a.eid - b.eid || a.lid - b.lid || a.nid - b.nid,
  );
  const head = Buffer.alloc(6 + recs.length * 12);
  head.writeUInt16BE(0, 0);
  head.writeUInt16BE(recs.length, 2);
  head.writeUInt16BE(head.length, 4);
  let off = 0;
  const parts = [];
  recs.forEach((r, i) => {
    const o = 6 + i * 12;
    head.writeUInt16BE(r.pid, o);
    head.writeUInt16BE(r.eid, o + 2);
    head.writeUInt16BE(r.lid, o + 4);
    head.writeUInt16BE(r.nid, o + 6);
    head.writeUInt16BE(r.buf.length, o + 8);
    head.writeUInt16BE(off, o + 10);
    parts.push(r.buf);
    off += r.buf.length;
  });
  return Buffer.concat([head, ...parts]);
}

/** sfnt 의 name 테이블만 바꿔 디렉터리 · 체크섬을 다시 만든다. */
function patchSfnt(src) {
  const n = src.readUInt16BE(4);
  const tables = [];
  for (let i = 0; i < n; i++) {
    const o = 12 + i * 16;
    const tag = src.toString("latin1", o, o + 4);
    const data = Buffer.from(
      src.subarray(
        src.readUInt32BE(o + 8),
        src.readUInt32BE(o + 8) + src.readUInt32BE(o + 12),
      ),
    );
    tables.push({ tag, data });
  }
  const nameT = tables.find((t) => t.tag === "name");
  nameT.data = renameTable(nameT.data);
  const headT = tables.find((t) => t.tag === "head");
  headT.data.writeUInt32BE(0, 8);
  tables.sort((a, b) => (a.tag < b.tag ? -1 : 1));
  let off = 12 + n * 16;
  const dir = Buffer.from(src.subarray(0, 12));
  const bodies = [];
  const dirs = [];
  for (const t of tables) {
    const d = Buffer.alloc(16);
    d.write(t.tag, 0, "latin1");
    d.writeUInt32BE(checksum(t.data), 4);
    d.writeUInt32BE(off, 8);
    d.writeUInt32BE(t.data.length, 12);
    dirs.push(d);
    const pad = Buffer.alloc((4 - (t.data.length % 4)) % 4);
    bodies.push(t.data, pad);
    off += t.data.length + pad.length;
  }
  const out = Buffer.concat([dir, ...dirs, ...bodies]);
  const adj = (0xb1b0afba - checksum(out)) >>> 0;
  const hi = out.indexOf(headT.data, 12 + n * 16);
  out.writeUInt32BE(adj, hi + 8);
  return out;
}

const [src] = process.argv.slice(2);
if (!src)
  throw new Error("usage: build-font-supplement.mjs <PretendardVariable.ttf>");
const ttf = await subsetFont(readFileSync(src), TEXT, {
  targetFormat: "truetype",
});
const woff2 = Buffer.from(await wawoff2.compress(patchSfnt(Buffer.from(ttf))));
writeFileSync(
  new URL("../public/fonts/pretendard-supplement.woff2", import.meta.url),
  woff2,
);
console.log(
  "pretendard-supplement.woff2",
  woff2.length,
  "bytes, family",
  NEW_NAME,
);
