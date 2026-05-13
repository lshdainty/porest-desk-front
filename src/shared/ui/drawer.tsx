"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/shared/lib"

/*
 * Porest Drawer — porest-design specs/components/drawer.md SoT 기반.
 * Phase 2 마이그레이션: porest overlay/shadow/handle 토큰 + desk-front 구조 보존.
 *
 * 호환 보존:
 *   - vaul shouldScaleBackground=false (desk-front 기본값) — 배경 스케일링 안 함
 *   - DrawerHeader/Body/Footer 3-슬롯 구조
 *   - DrawerTitle 17px/700, DrawerDescription text-xs
 *
 * Porest 시각:
 *   - overlay: var(--overlay-dim-light) light / var(--overlay-dim-dark) dark
 *   - content: bg-[var(--bg-surface)] + rounded-t-[radius-xl] + shadow-xl inline
 *   - handle: 40×4 + bg-surface-input + rounded-full
 */

const Drawer = ({
  shouldScaleBackground = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger
const DrawerPortal = DrawerPrimitive.Portal
const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[100] bg-[var(--overlay-dim-light)] dark:bg-[var(--overlay-dim-dark)]",
      className,
    )}
    {...props}
  />
))
DrawerOverlay.displayName = "DrawerOverlay"

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, style, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[100] flex h-auto max-h-[88%] flex-col rounded-t-[var(--radius-xl)] bg-[var(--bg-surface)] outline-none",
        className,
      )}
      style={{ boxShadow: "var(--shadow-xl)", ...style }}
      {...props}
    >
      {/* handle — preview `.drw-handle` SoT (40×4 + surface-input + rounded-full) */}
      <div className="mx-auto mt-1.5 mb-2 h-1 w-10 shrink-0 rounded-full bg-surface-input" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center gap-3 px-5 pb-4 pt-2",
      className,
    )}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1 overflow-y-auto p-5", className)} {...props} />
)
DrawerBody.displayName = "DrawerBody"

// 데스크탑 다이얼로그 footer 와 동일한 패턴: 우측 정렬 가로 배치.
// 삭제 등 좌측 배치할 버튼은 className="mr-auto" 로 밀어내기.
const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-auto flex items-center justify-end gap-2 px-5 py-3",
      className,
    )}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-[17px] font-bold tracking-[-0.01em] text-[var(--fg-primary)]",
      className,
    )}
    {...props}
  />
))
DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-xs text-[var(--fg-tertiary)] mt-0.5", className)}
    {...props}
  />
))
DrawerDescription.displayName = "DrawerDescription"

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
