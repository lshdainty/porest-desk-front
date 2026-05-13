import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/index"

/*
 * Porest Card — porest-design specs/components/card.md SoT 기반.
 * Phase 2 마이그레이션: porest 토큰 + desk-front variants(6) 보존.
 *
 * variants:
 *   default   — bg-surface-default + border + shadow-sm. 표준 카드.
 *   elevated  — bg-surface-default + border + shadow-md. 강조 카드.
 *   outline   — bg-surface-default + border + shadow-none. 본문 분리만.
 *   inset     — bg-[var(--bg-sunken)] + border-0. 페이지 내 영역 구획.
 *   brand     — bg-[var(--bg-brand-tint)] + border-[var(--border-brand-soft)] + shadow-sm.
 *               Cobalt 톤 강조.
 *   warm      — bg-[var(--bg-warm-tint)] + border-[var(--bg-warm-tint-strong)] + shadow-sm.
 *               (Phase 1 alias로 warm → surface-input 정합 자동)
 *
 * composition: Card > CardHeader > CardTitle / CardDescription
 *                    > CardContent
 *                    > CardFooter
 * padding은 호출자가 지정 — 인라인 또는 CardContent/CardHeader className에서.
 */

const cardVariants = cva(
  "rounded-[var(--radius-lg)] border text-text-primary transition-[background-color,border-color,box-shadow] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]",
  {
    variants: {
      variant: {
        default:
          "bg-surface-default border-border-default shadow-[var(--shadow-sm)]",
        elevated:
          "bg-surface-default border-border-default shadow-[var(--shadow-md)]",
        outline:
          "bg-surface-default border-border-default shadow-none",
        inset:
          "bg-[var(--bg-sunken)] border-0 shadow-none",
        brand:
          "bg-[var(--bg-brand-tint)] border-[var(--border-brand-soft)] shadow-[var(--shadow-sm)]",
        warm:
          "bg-[var(--bg-warm-tint)] border-[var(--bg-warm-tint-strong)] shadow-[var(--shadow-sm)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  ),
)
Card.displayName = "Card"

// sec-head 시각: flex items-center gap-2 mb-3.
// 부수 메타 정보는 자식 span/div에서 marginLeft:auto 또는 ml-auto 로 우측 밀어내기.
// data-slot은 .all 같은 자손 셀렉터(porest.css)가 카드 헤더 안에서도 매칭되게 함.
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-header"
    className={cn("flex items-center gap-2 mb-3", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// sec-head h2 시각: 16px / 700 / -0.015em
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-base font-bold tracking-[-0.015em] leading-snug text-text-primary",
      className,
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-[13px] text-[var(--fg-secondary)] mt-0.5", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  // padding 미지정. 외곽 <Card>의 padding 또는 CardContent className에서 지정.
  <div ref={ref} className={cn(className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-2 mt-4 pt-3.5 border-t border-border-default",
      className,
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
}
