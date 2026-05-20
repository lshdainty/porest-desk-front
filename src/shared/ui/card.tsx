import * as React from "react"

import { cn } from "@/shared/lib/index"

/*
 * Porest Card — porest-design specs/components/card.md SoT 기반.
 * 단일 spec — variant 없음, border 없음, shadow-only elevation.
 *
 * - Card: rounded-lg + bg-surface-default + inline boxShadow(var(--shadow-sm)).
 *   inline boxShadow는 Tailwind v4 utility 내부 분해(--tw-shadow-*) 문제로
 *   다크모드 토큰 override 우회되는 이슈 fix (spec migration note).
 *   Card 자체는 padding 없음 — sub-component가 padding 보유 (shadcn 정석 패턴).
 * - CardHeader: flex flex-col gap-xs p-xl. title + description 세로 stack.
 *   horizontal 헤더가 필요하면 callers 에서 className="flex-row items-center justify-between" override.
 * - CardContent: p-xl, 단 CardHeader/CardFooter 다음에 올 땐 pt-0 (헤더와 자연 연결).
 *   first-child면 단독 standalone 카드(site.html `.review-summary` 톤)로 full padding.
 * - CardFooter: flex items-center p-xl pt-0. 액션 영역 — 보통 content/header 다음.
 */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[var(--radius-lg)] bg-surface-default text-text-primary transition-[background-color,box-shadow] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]",
      className,
    )}
    style={{ boxShadow: "var(--shadow-sm)", ...style }}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-header"
    className={cn(
      "flex flex-col gap-[var(--spacing-xs)] p-[var(--spacing-lg)] md:p-[var(--spacing-xl)]",
      className,
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-title-md leading-none tracking-tight text-text-primary",
      className,
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-body-sm text-text-secondary", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  // first-child일 땐 full p-xl(standalone 카드), CardHeader 다음일 땐 pt-0(헤더 자연 연결).
  <div
    ref={ref}
    className={cn(
      "p-[var(--spacing-lg)] md:p-[var(--spacing-xl)] [&:not(:first-child)]:pt-0",
      className,
    )}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  // first-child일 땐 full p-xl, content/header 다음일 땐 pt-0(자연 연결).
  <div
    ref={ref}
    className={cn(
      "flex items-center p-[var(--spacing-lg)] md:p-[var(--spacing-xl)] [&:not(:first-child)]:pt-0",
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
}
