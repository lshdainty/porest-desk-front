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
/** 최상위 메뉴 버튼 — 번역 mock 이 키를 그대로 돌려주므로 라벨이 곧 labelKey 다. */
const menuButton = (label: string) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-sidebar="menu-button"]'))
    .find(b => b.textContent === label)
/** 부모 `증권` 버튼. */
const stocksButton = () => menuButton('stocks')

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
    // 들어가면 하위도 따라 펼쳐진다.
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

// 부모 `증권` 클릭은 **이동 + 펼침**을 함께 한다. 경로 파생만으로도 증권 화면 밖에서
// 누르면 펼쳐지지만, 셰브론으로 접어 둔 뒤엔 오버라이드가 `false` 로 남아 닫힌 채 이동했다.
// 그래서 부모 클릭이 오버라이드를 펼침으로 되돌린다 — 접는 자리는 셰브론 하나로 둔다.
describe('PorestSidebar 부모 증권 클릭 = 이동 + 펼침', () => {
  beforeEach(() => {
    state.connectedBrokers = ['TOSS', 'NAMU']
  })

  it('셰브론으로 접어 둔 뒤 부모를 누르면 이동하면서 다시 펼친다', () => {
    // 경로 파생만으로는 안 되는 자리 — 여기가 이 변경의 핵심이다.
    render('/desk')
    click(subToggle()!) // 펼쳤다가
    click(subToggle()!) // 다시 접는다 → 사용자 오버라이드가 '접힘' 으로 남는다
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('false')

    click(stocksButton()!)
    expect(currentPath()).toBe('/desk/stocks')
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('true')
    expect(subHrefs()).toEqual(['/desk/stocks/toss', '/desk/stocks/namu'])
  })

  it('펼쳐진 채로 부모를 누르면 이동해도 펼침이 유지된다', () => {
    render('/desk/stocks/toss')
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('true')
    click(stocksButton()!)
    expect(currentPath()).toBe('/desk/stocks')
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('true')
  })

  it('이미 증권 화면이라 이동이 no-op 이어도 접히지 않는다 — 몇 번을 눌러도 펼침이다', () => {
    // 토글로 만들면 같은 클릭이 갈 때는 열고 와 있을 때는 닫아 결과가 갈린다.
    render('/desk/stocks')
    click(stocksButton()!)
    expect(currentPath()).toBe('/desk/stocks')
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('true')
    click(stocksButton()!)
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('true')
  })

  it('셰브론으로 접었다가 그 화면에서 부모를 누르면 다시 펼친다', () => {
    render('/desk/stocks/namu')
    click(subToggle()!)
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('false')
    click(stocksButton()!)
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('true')
  })

  it('부모로 펼친 뒤에도 셰브론은 그대로 독립 토글이다', () => {
    render('/desk')
    click(stocksButton()!)
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('true')
    click(subToggle()!)
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('false')
    // 셰브론은 여전히 이동시키지 않는다 — 부모 클릭으로 온 경로가 그대로다.
    expect(currentPath()).toBe('/desk/stocks')
  })

  it('하위 없는 항목을 눌러도 증권 펼침은 건드리지 않는다', () => {
    render('/desk/stocks/namu')
    click(menuButton('home')!)
    expect(currentPath()).toBe('/desk')
    // 오버라이드가 안 생겼으니 경로 파생 그대로 — 증권 화면을 떠났으므로 접힌다.
    expect(subToggle()?.getAttribute('aria-expanded')).toBe('false')
  })
})
