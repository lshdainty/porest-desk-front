/**
 * 카테고리/자산 아이콘 타일의 corner radius.
 *
 * 고정 radius(12px)를 모든 크기에 쓰면 작은 타일일수록 원에 가까워져 더 둥글어
 * 보인다(28px+12px ≈ 원형). 기준 "오늘 쓴 돈" 타일(40px/12px, 비율 0.3)의 둥글기를
 * 어느 크기에서나 동일하게 유지하도록 radius 를 크기에 비례시킨다.
 *
 * round(size × 0.3): 28→8 / 32→10 / 36→11 / 38→11 / 40→12 / 44→13 / 48→14.
 * (기존 CategoryChip 의 10/12/14 설계와 동일.)
 */
export const tileRadius = (size: number): number => Math.round(size * 0.3)
