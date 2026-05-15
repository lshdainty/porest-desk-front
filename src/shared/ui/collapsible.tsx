import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

/*
 * Porest Collapsible — porest-design specs/components/collapsible.md SoT 기반.
 *
 * - Radix Collapsible 베이스. 단순 open/closed 토글 primitive.
 * - composition: Collapsible > CollapsibleTrigger / CollapsibleContent
 * - 스타일은 사용처에서 직접 — primitive만 제공.
 */

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
