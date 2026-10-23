import type { CSSProperties } from "react";

/**
 * GrooTree — 그루 로고의 나무(`src/shared/assets/img/groo_logo.svg` 의 path 를 그대로 옮겼다. 다시 그리지 않는다).
 *
 * 칠은 시안 고정값이라 라이트 · 다크가 같다(진한 잎 #075B3C · 겹침 #218D49 · 밝은 잎 #43BF5E · 기둥 #A96D57).
 * 다크에서 잎을 밝히거나 흰 타일을 두르지 않고, 이 값을 화면 채움 · 글자 · 선에 쓰지 않는다(I-05 L).
 * 보기 상자 `147 183 154 166` — 폭 : 높이 = 154 : 166. `size` 는 **높이**(px)이고 폭은 비율로 따라온다.
 * 장식이라 화면 낭독에서 빠진다 — 이름은 옆 글("그루 담다")이 말한다.
 */
export const GROO_TREE_RATIO = 154 / 166;

export function GrooTree({
  size = 56,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const width = Math.round(size * GROO_TREE_RATIO * 100) / 100;
  return (
    <svg
      width={width}
      height={size}
      viewBox="147 183 154 166"
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      aria-hidden
      focusable="false"
    >
      <path
        fill="#A96D57"
        d="M212 282H235C234 304 237 323 244 339H203C210 321 212 303 212 282Z"
      />
      <path
        fill="#075B3C"
        d="M163 193C182 191 207 201 224 212C245 230 248 261 224 288C201 290 178 282 166 265C154 248 154 215 163 193Z"
      />
      <path
        fill="#43BF5E"
        d="M224 212C242 201 265 194 284 193C292 214 294 245 282 265C271 282 248 290 224 288C201 263 200 232 224 212Z"
      />
      <path
        fill="#218D49"
        d="M224 212C245 230 248 261 224 288C201 263 200 232 224 212Z"
      />
    </svg>
  );
}
