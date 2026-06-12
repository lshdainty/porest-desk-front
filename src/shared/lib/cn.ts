import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * 프로젝트 커스텀 font-size 유틸(`text-caption` 등 — porest-tokens.css `--text-*`)을
 * twMerge 에 font-size 그룹으로 등록.
 *
 * 기본 설정의 twMerge 는 모르는 `text-*` 클래스를 색상 그룹으로 분류해서
 * `text-text-primary` / `text-[var(--fg-brand)]` 같은 색상 클래스와 충돌로 보고
 * 지워버린다 (예: Button accent+sm 에서 브랜드색 소실 → 흰색 상속).
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-xl',
            'display-lg',
            'display-md',
            'display-sm',
            'title-lg',
            'title-md',
            'title-sm',
            'body-lg',
            'body-md',
            'body-sm',
            'label-md',
            'label-sm',
            'caption',
            'badge',
            'overline',
          ],
        },
      ],
    },
  },
})

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}
