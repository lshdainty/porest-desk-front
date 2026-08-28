// 증권사 구분이 페이지 안 탭에서 사이드바 하위 메뉴로 옮겨왔다.
// 하위 메뉴는 **연결한 증권사** 목록이라 사용자마다 달라진다 — 어느 경우에 몇 개가 뜨는지를 고정한다.
// 여기에 접기/펴기가 붙으면서 "몇 개가 뜨나" 는 경로에 따라 달라진다 — 접혀 있으면 DOM 에서
// 아예 빠진다(Radix 가 닫힌 콘텐츠를 언마운트한다). 그래서 목록을 세는 테스트는 펼쳐지는
// 경로(증권 화면)에서 렌더한다.
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { SidebarProvider } from '@/shared/ui/sidebar'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

const state = vi.hoisted(() => ({
  hasSecurities: true,
  connectedBrokers: [] as string[],
  connections: undefined as { broker: string; displayName: string }[] | undefined,
  brokerConnectionsEnabled: undefined as boolean | undefined,
}))

vi.mock('@/features/subscription/model/useSubscription', () => ({
  useHasSecurities: () => state.hasSecurities,
  useMyFeatures: () => ({
    data: {
      features: state.hasSecurities ? ['SECURITIES'] : [],
      connectedBrokers: state.connectedBrokers,
      primaryBroker: null,
      tossConnected: false,
    },
    isLoading: false,
  }),
  useBrokerConnections: (enabled = true) => {
    state.brokerConnectionsEnabled = enabled
    return { data: enabled ? state.connections : undefined }
  },
}))
vi.mock('@/features/user', () => ({ useCurrentUser: () => ({ data: undefined }) }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

const { PorestSidebar } = await import('./PorestSidebar')

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  state.hasSecurities = true
  state.connectedBrokers = []
  state.connections = undefined
  state.brokerConnectionsEnabled = undefined
  // jsdom 엔 matchMedia 가 없다 — SidebarProvider 가 이걸 부른다.
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    })
  }
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

// 부모 항목은 <a> 가 아니라 navigate() 라 href 로 확인할 수 없다 — 실제 경로를 본다.
// 모듈 변수에 렌더 중 대입하지 않고 DOM 으로 흘린다(렌더는 순수해야 한다 — react-hooks/globals).
function PathProbe() {
  return <span data-path={useLocation().pathname} />
}
const currentPath = () => container.querySelector('[data-path]')?.getAttribute('data-path')

// sidebarOpen=false → 사이드바 자체가 접힌 상태(collapsible="icon").
function render(path = '/desk', sidebarOpen?: boolean) {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <PathProbe />
        {/* AppLayout 과 같은 배선 — Sidebar 는 Provider 안에서만 산다. */}
        <SidebarProvider open={sidebarOpen}>
          <PorestSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    ),
  )
}

const click = (el: HTMLElement) => act(() => { el.click() })

const subLinks = () =>
  Array.from(container.querySelectorAll<HTMLAnchorElement>('[data-sidebar="menu-sub-button"]'))
const subHrefs = () => subLinks().map(a => a.getAttribute('href'))
/** 하위 메뉴 접기/펴기 셰브론. 하위가 없으면 아예 안 그린다. */
const subToggle = () => container.querySelector<HTMLButtonElement>('[data-sidebar="menu-action"]')
/** 부모 `증권` 버튼 — 번역 mock 이 키를 그대로 돌려주므로 라벨이 'stocks' 다. */
const stocksButton = () =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-sidebar="menu-button"]'))
    .find(b => b.textContent === 'stocks')

describe('PorestSidebar 증권 하위 메뉴', () => {
  it('연결이 둘 이상이면 증권사별 하위 항목이 뜬다', () => {
    state.connectedBrokers = ['TOSS', 'NAMU']
    render('/desk/stocks/toss')
    expect(subHrefs()).toEqual(['/desk/stocks/toss', '/desk/stocks/namu'])
  })

  it('연결이 하나면 하위 메뉴가 없다 — 고를 게 없는 트리는 안 만든다', () => {
    state.connectedBrokers = ['TOSS']
    // 증권 화면에서 본다 — 여기서도 안 뜬다는 게 "접혀서 안 보이는" 것과 구분되는 지점이다.
    render('/desk/stocks/toss')
    expect(subLinks()).toHaveLength(0)
    // 트리가 없으니 접기/펴기 토글도 없다.
    expect(subToggle()).toBeNull()
    // 증권 항목 자체는 남는다.
    expect(container.textContent).toContain('stocks')
  })

  it('연결이 없으면 하위 메뉴가 없다 — 눌러도 연결 안내로 되돌아올 뿐이다', () => {
    state.connectedBrokers = []
    render('/desk/stocks')
    expect(subLinks()).toHaveLength(0)
    expect(subToggle()).toBeNull()
  })

  it('증권 구독이 없으면 증권 메뉴도 하위도 없고, 증권사 조회를 걸지 않는다', () => {
    state.hasSecurities = false
    state.connectedBrokers = ['TOSS', 'NAMU']
    render()
    expect(subLinks()).toHaveLength(0)
    expect(container.textContent).not.toContain('stocks')
    expect(state.brokerConnectionsEnabled).toBe(false)
  })

  it('표시명은 서버 displayName 을 쓰고, 없으면 번역 키로 떨어진다', () => {
    state.connectedBrokers = ['TOSS', 'NAMU']
    state.connections = [{ broker: 'TOSS', displayName: '토스증권' }]
    render('/desk/stocks/toss')
    expect(subLinks().map(a => a.textContent)).toEqual(['토스증권', 'broker.namu'])
  })

  it('보고 있는 증권사 항목만 활성으로 표시한다', () => {
    state.connectedBrokers = ['TOSS', 'NAMU']
    render('/desk/stocks/namu')
    expect(subLinks().map(a => a.getAttribute('data-active'))).toEqual(['false', 'true'])
    // aria-current 는 지금 페이지 하나에만 — 조상(증권)까지 달면 현재 위치가 둘로 읽힌다.
    expect(subLinks().map(a => a.getAttribute('aria-current'))).toEqual([null, 'page'])
    expect(stocksButton()?.getAttribute('aria-current')).toBeNull()
    // 시각 강조는 부모에도 그대로 남는다.
    expect(stocksButton()?.getAttribute('data-active')).toBe('true')
  })
})

describe('PorestSidebar 증권 하위 메뉴 접기/펴기', () => {
  beforeEach(() => {
    state.connectedBrokers = ['TOSS', 'NAMU']
  })

  it('증권 화면 밖에서는 접혀 있다 — 상태는 경로에서 나온다', () => {
    render('/desk')
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('false')
    expect(subLinks()).toHaveLength(0)
  })

  it('증권사 화면에 있으면 펼쳐진 채 뜬다 — 지금 어디 있는지가 보여야 한다', () => {
    render('/desk/stocks/namu')
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('true')
    expect(subHrefs()).toEqual(['/desk/stocks/toss', '/desk/stocks/namu'])
  })

  it('셰브론으로 접었다 펼 수 있다', () => {
    render('/desk/stocks/namu')
    click(subToggle()!)
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('false')
    expect(subLinks()).toHaveLength(0)
    click(subToggle()!)
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('true')
    expect(subHrefs()).toEqual(['/desk/stocks/toss', '/desk/stocks/namu'])
  })

  it('셰브론엔 상태에 맞는 이름이 붙는다 — 아이콘뿐이라 이름이 없으면 못 읽는다', () => {
    // 번역 mock 이 키를 그대로 돌려주므로 키가 바뀌는지로 본다.
    render('/desk')
    expect(subToggle()?.getAttribute('aria-label')).toBe('expandSubmenu')
    click(subToggle()!)
    expect(subToggle()?.getAttribute('aria-label')).toBe('collapseSubmenu')
  })

  it('셰브론은 이동시키지 않는다 — 부모로 가는 길과 겹치지 않는다', () => {
    render('/desk')
    click(subToggle()!)
    expect(currentPath()).toBe('/desk')
    expect(subHrefs()).toEqual(['/desk/stocks/toss', '/desk/stocks/namu'])
  })

  it('부모 증권 라벨은 여전히 기본 증권사 화면으로 간다', () => {
    render('/desk')
    click(stocksButton()!)
    // /desk/stocks 로 가면 라우터가 기본 증권사로 리다이렉트한다(PR #306).
    expect(currentPath()).toBe('/desk/stocks')
    // 들어가면 하위도 따라 펼쳐진다 — 마운트 시점 한 번이 아니라 경로 파생이라 가능하다.
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('true')
  })

  it('아이콘 모드에선 셰브론도 하위 목록도 숨는다 — 토글이 생겨도 그대로다', () => {
    render('/desk/stocks/namu', false)
    // 사이드바가 실제로 아이콘 모드인지부터 — 이 속성이 아래 클래스를 켜는 스위치다.
    expect(container.querySelector('[data-collapsible="icon"]')).not.toBeNull()
    // 숨김은 CSS 라 jsdom 이 계산해 주지 않는다. 그 CSS 를 켜는 클래스가 붙었는지를 본다.
    const hide = 'group-data-[collapsible=icon]:hidden'
    expect(subToggle()!.classList.contains(hide)).toBe(true)
    expect(container.querySelector('[data-sidebar="menu-sub"]')!.classList.contains(hide)).toBe(true)
  })
})
