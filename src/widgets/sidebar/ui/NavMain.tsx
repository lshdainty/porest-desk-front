import { type LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/shared/ui/sidebar'

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  children?: { title: string; url: string }[]
}

export function NavMain({
  items,
  label,
}: {
  items: NavItem[]
  label?: string
}) {
  const location = useLocation()

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const isActive = item.url === '/desk'
            ? location.pathname === '/desk'
            : location.pathname.startsWith(item.url)

          if (item.children?.length) {
            const isChildActive = item.children.some((child) =>
              location.pathname.startsWith(child.url),
            )
            return (
              <Collapsible
                key={item.url}
                asChild
                defaultOpen={isActive || isChildActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={isActive && !isChildActive}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.children.map((child) => {
                        const isSubActive = location.pathname.startsWith(child.url)
                        return (
                          <SidebarMenuSubItem key={child.url}>
                            <SidebarMenuSubButton asChild isActive={isSubActive}>
                              <Link to={child.url}>
                                <span>{child.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          return (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                <Link to={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
