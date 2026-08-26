/**
 * 증권 화면 공용 다이얼로그 — 종목 검색 · 관심 그룹 편집.
 *
 * 둘 다 **증권사와 무관하다.** 검색은 서버 `stock_master`(`/v1/stocks`)를, 그룹 편집은
 * `stock_watch`(`/v1/stock-watch/**`)를 쓴다 — 증권사 크리덴셜이 필요 없다.
 * 토스 페이지 안에 있던 것을 그대로 끌어냈다(마크업·동작 무변경).
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { ConfirmDialog, ModalShell } from '@/shared/ui/porest/dialogs'
import { useStockSearch } from '../model/useStockMaster'
import {
  useCreateWatchGroup,
  useDeleteWatchGroup,
  useRenameWatchGroup,
} from '../api/watchlistApi'
import type { StockMasterItem, WatchGroup } from '../api/stockApi'
import { StockRow } from './stock-row'

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// ---- 종목 검색 다이얼로그 (서버 stock_master — 국내 + 해외 6개국) -------------

/**
 * @param onPick 고른 종목. 심볼만 쓰는 화면(토스)도 있고 마스터 전체가 필요한 화면(나무 —
 *   국내/해외 분기를 국가코드가 정한다)도 있어서 마스터 항목을 통째로 넘긴다.
 */
export function StockSearchDialog({ mobile, onPick, onClose }: { mobile: boolean; onPick: (item: StockMasterItem) => void; onClose: () => void }) {
  const { t } = useTranslation('stocks')
  const [q, setQ] = useState('')
  const debounced = useDebounced(q.trim(), 300)
  const { data: results = [], isFetching } = useStockSearch(debounced, 20)
  const searched = debounced.length > 0 && !isFetching && q.trim() === debounced
  return (
    <ModalShell title={t('search.label')} onClose={onClose} mobile={mobile} mobileMinHeight="85dvh">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-tertiary)', pointerEvents: 'none' }} />
          <Input search autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={t('search.placeholder')} className="w-full pl-9" />
        </div>
        <div style={{ maxHeight: mobile ? undefined : '56vh', overflowY: 'auto' }}>
          {q.trim().length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>{t('search.hint')}</div>
          ) : searched && results.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>{t('search.noResults', { query: q })}</div>
          ) : (
            results.map((s: StockMasterItem) => (
              <StockRow
                mobile={mobile}
                key={`${s.marketCode}:${s.symbol}`}
                stock={{ symbol: s.symbol, name: s.nameKr, countryCode: s.countryCode, currency: s.currency }}
                sub={`${t(`market.${s.marketCode}`, { defaultValue: s.marketCode })} · ${t(`securityType.${s.securityType}`, { defaultValue: s.securityType })}`}
                right={<span />}
                onClick={() => {
                  onPick(s)
                  onClose()
                }}
              />
            ))
          )}
        </div>
      </div>
    </ModalShell>
  )
}

// ---- 관심목록 그룹 편집 다이얼로그 ------------------------------------------

export function WatchGroupDialog({ mobile, group, onClose }: { mobile: boolean; group: WatchGroup | null; onClose: () => void }) {
  const { t } = useTranslation('stocks')
  const { t: tc } = useTranslation('common')
  const [name, setName] = useState(group?.groupName ?? '')
  const createMut = useCreateWatchGroup()
  const renameMut = useRenameWatchGroup()
  const deleteMut = useDeleteWatchGroup()
  // 브라우저 confirm 은 앱 테마를 안 따르고 문구도 못 꾸민다 — 프로젝트 다이얼로그를 쓴다.
  const [confirmDelete, setConfirmDelete] = useState(false)
  const busy = createMut.isPending || renameMut.isPending || deleteMut.isPending
  const canSave = name.trim().length > 0 && !busy

  const save = () => {
    const groupName = name.trim()
    if (!groupName) return
    if (group) {
      renameMut.mutate({ groupId: group.rowId, groupName }, {
        onSuccess: onClose,
        onError: () => toast.error(t('watch.groupSaveFail')),
      })
    } else {
      createMut.mutate(groupName, {
        onSuccess: onClose,
        onError: () => toast.error(t('watch.groupSaveFail')),
      })
    }
  }

  return (
    <ModalShell title={group ? t('watch.groupRename') : t('watch.groupAdd')} onClose={onClose} mobile={mobile}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('watch.groupNamePlaceholder')}
          onKeyDown={e => {
            if (e.key === 'Enter' && canSave) save()
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" disabled={!canSave} onClick={save} style={{ flex: 1 }}>
            {tc('save')}
          </Button>
          {group && (
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              {t('watch.groupDelete')}
            </Button>
          )}
        </div>
      </div>

      {confirmDelete && group && (
        <ConfirmDialog
          title={t('watch.groupDelete')}
          message={t('watch.groupDeleteConfirm', { name: group.groupName })}
          confirmLabel={t('watch.groupDelete')}
          danger
          loading={deleteMut.isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() =>
            deleteMut.mutate(group.rowId, {
              onSuccess: onClose,
              onError: () => toast.error(t('watch.groupSaveFail')),
            })
          }
        />
      )}
    </ModalShell>
  )
}
