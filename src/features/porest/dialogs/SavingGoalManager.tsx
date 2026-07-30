import { useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'
import type { IconName } from 'lucide-react/dynamic'
import { tileRadius } from '@/shared/lib'
import { KRW, isEn } from '@/shared/lib/porest/format'
import { useDeleteSavingGoal, useSavingGoals } from '@/features/savingGoal'
import type { SavingGoal } from '@/entities/savingGoal'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { ConfirmDialog } from '@/shared/ui/porest/dialogs'
import { MANAGE_ROW } from '@/shared/ui/porest/manage-row-tokens'
import { ManagerHead, ManagerShell } from '@/shared/ui/porest/manager-layout'
import { SavingGoalAddDialog } from '@/widgets/asset-full/ui/SavingGoalAddDialog'
import { Skeleton as SkeletonBase } from '@/shared/ui/skeleton'

const formatDeadline = (deadline: string | null): string | null => {
  if (!deadline) return null
  const d = new Date(deadline)
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

// 모바일 카드 다이어트 — 항목 셸: 모바일은 카드 없이 행(위쪽 divider), 데스크톱은 Card.
function FlatItem({
  mobile,
  idx,
  onTap,
  children,
}: {
  mobile: boolean
  idx: number
  onTap?: () => void
  children: ReactNode
}) {
  if (!mobile) return <Card>{children}</Card>

  return (
    <div
      onClick={onTap}
      style={{
        // 행 좌우 inset 4 — RecurringManager 목록 행과 같은 값.
        padding: '12px 4px',
        borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none',
        cursor: onTap ? 'pointer' : undefined,
      }}
    >
      {children}
    </div>
  )
}

// 모바일 카드 다이어트 — CardContent 조건부: 모바일은 패딩 없는 평문, 데스크톱은 CardContent.
function MaybeContent({ mobile, children }: { mobile: boolean; children: ReactNode }) {
  return mobile ? <div>{children}</div> : <CardContent>{children}</CardContent>
}

function GoalCard({
  goal,
  mobile,
  idx,
  onEdit,
  onDelete,
}: {
  goal: SavingGoal
  mobile: boolean
  idx: number
  onEdit: (g: SavingGoal) => void
  onDelete: (g: SavingGoal) => void
}) {
  const { t } = useTranslation('asset')
  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
  const color = goal.color ?? 'var(--bg-brand)'
  const iconName = (goal.icon && goal.icon.trim().length > 0 ? goal.icon : 'piggy-bank') as IconName
  const tile = mobile ? 40 : 36

  return (
    // 모바일 = 카드 탭이 곧 편집(디자인 GoalManager), 데스크톱 = 우측 편집/삭제 아이콘 버튼.
    // 모바일 카드 다이어트(RecurringManager 정합) — 항목마다 카드를 두지 않고 행 사이 divider 로만
    // 구분한다. 페이지 배경 위에 카드가 겹겹이 쌓이면 keep 카드(요약)의 위계가 죽는다.
    <FlatItem mobile={mobile} idx={idx} onTap={() => onEdit(goal)}>
      <MaybeContent mobile={mobile}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span
            style={{
              width: tile, height: tile, borderRadius: tileRadius(tile),
              background: `oklch(from ${color} l c h / 0.12)`,
              color,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <DynamicIcon name={iconName} size={mobile ? 19 : 17} fallback={() => <Target size={mobile ? 19 : 17} />} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: mobile ? 'var(--text-body-md)' : 'var(--text-body-sm)',
                fontWeight: '700',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {goal.title}
              {goal.isAchieved === 'Y' && (
                <span
                  style={{
                    marginLeft: 8,
                    padding: '1px 6px',
                    background: 'var(--bg-brand-subtle)',
                    color: 'var(--fg-brand-strong)',
                    fontSize: 'var(--text-badge)',
                    fontWeight: '600',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {t('achieved')}
                </span>
              )}
            </div>
            <div style={{ fontSize: mobile ? 'var(--text-caption)' : 'var(--text-badge)', color: 'var(--fg-tertiary)', marginTop: 1 }}>
              {formatDeadline(goal.deadlineDate) ?? t('savingGoal.noDeadline')}
            </div>
          </div>
          {mobile ? (
            <ChevronRight size={18} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
          ) : (
            <div className={MANAGE_ROW.actionsClassName} style={{ flexShrink: 0 }}>
              <Button variant="ghost" size="icon" onClick={() => onEdit(goal)}>
                <Pencil size={13} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={MANAGE_ROW.delClassName}
                onClick={() => onDelete(goal)}
              >
                <Trash2 size={13} />
              </Button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span className="num" style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-secondary)', fontWeight: '600' }}>
            {KRW(goal.currentAmount)} / {KRW(goal.targetAmount)}{!isEn() && '원'}
          </span>
          <span className="num" style={{ marginLeft: 'auto', fontSize: 'var(--text-label-sm)', fontWeight: '700', color }}>
            {pct.toFixed(0)}%
          </span>
        </div>
        <div
          style={{
            height: 6, background: 'var(--bg-sunken)',
            borderRadius: 'var(--radius-pill)', overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, pct)}%`, height: '100%',
              background: color, borderRadius: 'var(--radius-pill)',
            }}
          />
        </div>
      </MaybeContent>
    </FlatItem>
  )
}

function SavingGoalManagerSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 0 : 10 }}>
      {[0, 1, 2].map(i => (
        <FlatItem key={i} mobile={mobile} idx={i}>
          <MaybeContent mobile={mobile}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <SkeletonBase className="h-9 w-9 rounded-[10px] shrink-0" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <SkeletonBase className="h-4 w-1/3 mb-1.5" />
                <SkeletonBase className="h-3 w-1/4" />
              </div>
            </div>
            <SkeletonBase className="h-1.5 w-full rounded-full" />
          </MaybeContent>
        </FlatItem>
      ))}
    </div>
  )
}

/**
 * 저축 목표 관리 (설정 > 저축 목표) — design GoalManager SoT.
 * 전체 진행률 요약(keep 카드) + 목표 목록(추가·편집·삭제). 자산 화면은 조회 전용.
 */
export function SavingGoalManager({ mobile }: { mobile: boolean }) {
  const { t } = useTranslation('asset')
  const { t: tSettings } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')
  const goalsQ = useSavingGoals()
  const deleteMut = useDeleteSavingGoal()

  const [editing, setEditing] = useState<SavingGoal | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<SavingGoal | null>(null)

  const goals = goalsQ.data?.goals ?? []
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0)
  const totalPct = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

  return (
    <ManagerShell>
      {!mobile && (
        <ManagerHead
          title={t('savingGoals')}
          description={tSettings('sections.goals.managerDescription')}
        />
      )}

      {goals.length > 0 && (
        <Card variant="raised">
          <CardContent>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-caption)', color: 'var(--fg-tertiary)', fontWeight: '500', marginBottom: 3 }}>
                  {t('savingGoal.overallProgress')}
                </div>
                <div className="num" style={{ fontSize: 'var(--text-title-md)', fontWeight: '800', letterSpacing: '-0.01em' }}>
                  {KRW(totalCurrent)}{' '}
                  <span style={{ fontSize: 'var(--text-label-sm)', fontWeight: '600', color: 'var(--fg-tertiary)' }}>
                    / {KRW(totalTarget)}{!isEn() && '원'}
                  </span>
                </div>
              </div>
              <div className="num" style={{ fontSize: 'var(--text-title-lg)', fontWeight: '800', color: 'var(--fg-brand)', flexShrink: 0 }}>
                {totalPct.toFixed(0)}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 목록 라벨 + 목록은 한 묶음 — 부모 shell gap 이 라벨을 쪼개지 않도록. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 'var(--text-label-sm)', fontWeight: '700' }}>
            {t('savingGoal.goalCount', { n: goals.length })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            style={{ marginLeft: 'auto', color: 'var(--fg-brand)', fontWeight: 700 }}
            onClick={() => setEditing('new')}
          >
            <Plus size={14} strokeWidth={2.6} /> {t('addGoal')}
          </Button>
        </div>

        {goalsQ.isLoading ? (
          <SavingGoalManagerSkeleton mobile={mobile} />
        ) : goals.length === 0 ? (
          // 모바일 카드 다이어트 — 빈 상태도 카드를 두지 않는다(RecurringManager 빈 상태 정합).
          mobile ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
              {t('savingGoal.emptyManager')}
            </div>
          ) : (
            <Card>
              <CardContent>
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-label-sm)' }}>
                  {t('savingGoal.emptyManager')}
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 0 : 10 }}>
            {goals.map((g, i) => (
              <GoalCard
                key={g.rowId}
                goal={g}
                mobile={mobile}
                idx={i}
                onEdit={setEditing}
                onDelete={setConfirmDelete}
              />
            ))}
          </div>
        )}
      </div>

      {editing != null && (
        <SavingGoalAddDialog
          goal={editing === 'new' ? null : editing}
          mobile={mobile}
          onClose={() => setEditing(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={t('savingGoal.deleteTitle')}
          message={t('savingGoal.deleteConfirm', { title: confirmDelete.title })}
          confirmLabel={tCommon('delete')}
          danger
          loading={deleteMut.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() =>
            deleteMut.mutate(confirmDelete.rowId, {
              onSuccess: () => setConfirmDelete(null),
            })
          }
        />
      )}
    </ManagerShell>
  )
}
