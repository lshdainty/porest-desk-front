/*
 * Image Frame · Card Art · Logo Tile 의 견본 · 테스트에 쓰는 그림 대역 — 실제 사진 · 카드사 그림이 아니라 칠한 SVG 다(밖으로 요청을 보내지 않는다).
 * 화면에서 쓰지 않는다. 가로 · 세로 · 흰 그림 · 어두운 그림 · 못 불러오는 그림이 모두 있다.
 */

const svg = (w: number, h: number, body: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  )}`;

/** 가로 사진 600 × 450 — 하늘 · 산 · 해(가운데를 남겨 자르면 해가 남는다) */
export const PHOTO = svg(
  600,
  450,
  '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ec5e6"/><stop offset="1" stop-color="#f3dcc0"/></linearGradient></defs><rect width="600" height="450" fill="url(#s)"/><circle cx="300" cy="170" r="46" fill="#fff3c4"/><path d="M0 450V300l130-90 120 80 110-120 240 150v130Z" fill="#6f8f72"/><path d="M0 450V360l160-50 180 60 260-40v120Z" fill="#4b6b52"/>',
);

/** 세로 사진 480 × 600(4:5) */
export const PHOTO_TALL = svg(
  480,
  600,
  '<defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8c9d4"/><stop offset="1" stop-color="#8c9fc4"/></linearGradient></defs><rect width="480" height="600" fill="url(#s)"/><circle cx="240" cy="230" r="80" fill="#fff"/><rect x="120" y="360" width="240" height="40" rx="20" fill="#ffffffcc"/>',
);

/** 흰 그림 — 흰 바탕의 흰 카드(투명 윤곽이 없으면 틀이 묻힌다). 아주 옅은 글자만 있다 */
export const WHITE = svg(
  600,
  450,
  '<rect width="600" height="450" fill="#ffffff"/><text x="300" y="235" text-anchor="middle" font-family="sans-serif" font-size="56" font-weight="700" fill="#f1f1f1">SELECT</text>',
);

/** 어두운 그림 — 짙은 남색 한 색(투명 윤곽이 테를 만들지 않아야 한다) */
export const DARK = svg(
  600,
  450,
  '<rect width="600" height="450" fill="#10153a"/><circle cx="470" cy="110" r="60" fill="#1b2260"/>',
);

/** 가로 카드 그림 856 × 540(1.585) — 모서리까지 칠한 카드 */
export const CARD_WIDE = svg(
  856,
  540,
  '<defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b3a67"/><stop offset="1" stop-color="#6b7fd7"/></linearGradient></defs><rect width="856" height="540" fill="url(#c)"/><rect x="60" y="120" width="96" height="72" rx="12" fill="#f3d27a"/><text x="60" y="460" font-family="sans-serif" font-size="56" font-weight="700" fill="#ffffff">PORTRAIT TEST</text>',
);

/** 세로 카드 그림 540 × 856(0.63) — 시계 방향으로 90° 돌리면 CARD_WIDE 와 같은 모습(글자가 오른쪽으로 눕는다) */
export const CARD_TALL = svg(
  540,
  856,
  '<defs><linearGradient id="c" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7a2b3f"/><stop offset="1" stop-color="#e08a6a"/></linearGradient></defs><rect width="540" height="856" fill="url(#c)"/><rect x="348" y="60" width="72" height="96" rx="12" fill="#f3d27a"/><text x="60" y="796" font-family="sans-serif" font-size="48" font-weight="700" fill="#ffffff" transform="rotate(-90 60 796)">세로 카드</text>',
);

/** 로고 그림 — 투명 바탕 · 검은 마크(흰 판 위에서만 보인다) */
export const LOGO = svg(
  200,
  120,
  '<circle cx="60" cy="60" r="44" fill="#111111"/><rect x="116" y="30" width="72" height="60" rx="10" fill="#111111"/>',
);

/** 못 불러오는 그림 — 디코드가 실패한다 */
export const BROKEN = "data:image/png;base64,AAAA";
