// 증권사 구분이 페이지 안 탭에서 사이드바 하위 메뉴로 옮겨왔다.
// 하위 메뉴는 **연결한 증권사** 목록이라 사용자마다 달라진다 — 어느 경우에 몇 개가 뜨는지를 고정한다.
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
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

function render(path = '/desk') {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        {/* AppLayout 과 같은 배선 — Sidebar 는 Provider 안에서만 산다. */}
        <SidebarProvider>
          <PorestSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    ),
  )
}

const subLinks = () =>
  Array.from(container.querySelectorAll<HTMLAnchorElement>('[data-sidebar="menu-sub-button"]'))
const subHrefs = () => subLinks().map(a => a.getAttribute('href'))

describe('PorestSidebar 증권 하위 메뉴', () => {
  it('연결이 둘 이상이면 증권사별 하위 항목이 뜬다', () => {
    state.connectedBrokers = ['TOSS', 'NAMU']
    render()
    expect(subHrefs()).toEqual(['/desk/stocks/toss', '/desk/stocks/namu'])
  })

  it('연결이 하나면 하위 메뉴가 없다 — 고를 게 없는 트리는 안 만든다', () => {
    state.connectedBrokers = ['TOSS']
    render()
    expect(subLinks()).toHaveLength(0)
    // 증권 항목 자체는 남는다.
    expect(container.textContent).toContain('stocks')
  })

  it('연결이 없으면 하위 메뉴가 없다 — 눌러도 연결 안내로 되돌아올 뿐이다', () => {
    state.connectedBrokers = []
    render()
    expect(subLinks()).toHaveLength(0)
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
    render()
    expect(subLinks().map(a => a.textContent)).toEqual(['토스증권', 'broker.namu'])
  })

  it('보고 있는 증권사 항목만 활성으로 표시한다', () => {
    state.connectedBrokers = ['TOSS', 'NAMU']
    render('/desk/stocks/namu')
    expect(subLinks().map(a => a.getAttribute('data-active'))).toEqual(['false', 'true'])
  })
})
