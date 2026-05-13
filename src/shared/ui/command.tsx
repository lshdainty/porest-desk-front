"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/shared/lib/index"
import { Dialog, DialogContent } from "@/shared/ui/dialog"

/*
 * Porest Command — porest-design specs/components/command.md SoT 기반.
 *
 * - cmdk 베이스. ⌘K 스타일 명령어 팔레트.
 * - composition: Command > CommandInput / CommandList > CommandEmpty /
 *                CommandGroup > CommandItem / CommandSeparator / CommandShortcut
 * - CommandDialog: Command + Dialog 조합 (전역 ⌘K).
 *
 * 시각 정합 (menu family 통일):
 * - Input: Input md spec(h-10 + body-md + token padding + font-sans)
 * - Item: DropdownMenu/ContextMenu와 동일(rounded-sm + body-md + padding-sm/md, selected: surface-input)
 * - Group heading / Separator: DropdownMenu Label/Separator와 동일 패턴
 */

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-surface-default text-text-primary",
      className,
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:px-[var(--spacing-md)] [&_[cmdk-group-heading]]:py-[var(--spacing-sm)] [&_[cmdk-group-heading]]:text-label-sm [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-secondary [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-[var(--spacing-xs)] [&_[cmdk-input-wrapper]_svg]:h-4 [&_[cmdk-input-wrapper]_svg]:w-4 [&_[cmdk-input]]:h-10 [&_[cmdk-item]]:px-[var(--spacing-md)] [&_[cmdk-item]]:py-[var(--spacing-sm)] [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-border-default px-[var(--spacing-md)]" cmdk-input-wrapper="">
    <Search className="mr-[var(--spacing-sm)] h-4 w-4 shrink-0 text-text-secondary" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-10 w-full bg-transparent py-[var(--spacing-sm)] font-sans text-body-md text-text-primary outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
))
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-[var(--spacing-xl)] text-center text-body-sm text-text-secondary"
    {...props}
  />
))
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-[var(--spacing-xs)] text-text-primary [&_[cmdk-group-heading]]:px-[var(--spacing-md)] [&_[cmdk-group-heading]]:py-[var(--spacing-sm)] [&_[cmdk-group-heading]]:text-label-sm [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-secondary",
      className,
    )}
    {...props}
  />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("my-[var(--spacing-xs)] h-px bg-border-default", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer gap-[var(--spacing-sm)] select-none items-center rounded-sm px-[var(--spacing-md)] py-[var(--spacing-sm)] text-body-md text-text-primary outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-surface-input data-[selected=true]:text-text-primary data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className,
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-label-sm tracking-widest text-text-tertiary",
        className,
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
