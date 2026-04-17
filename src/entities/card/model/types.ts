import type { YNType } from '@/entities/asset'

export type CardType = 'CREDIT' | 'CHECK'
export type CardBenefitType = 'DISCOUNT' | 'MILEAGE' | 'POINT'

export interface CardCompany {
  rowId: number
  name: string
  nameEng: string
  logoUrl: string | null
}

export interface CardAnnualFee {
  amount: number
  label: string | null
}

export interface CardPerformanceMeta {
  requiredAmount: number
  requiredText: string | null
  isRequired: YNType
}

export interface CardCatalogSummary {
  rowId: number
  externalCardId: number
  company: CardCompany | null
  cardName: string
  cardType: CardType
  benefitType: CardBenefitType
  isDiscontinued: YNType
  onlyOnline: YNType
  launchDate: string | null
  imgUrl: string | null
  detailUrl: string | null
  annualFee: CardAnnualFee
  performance: CardPerformanceMeta
}

export interface CardBenefit {
  rowId: number
  category: string
  categoryIcon: string | null
  title: string | null
  summary: string | null
  detail: string | null
  sortOrder: number
}

export interface CardTagGroup {
  category: string
  tags: string[]
}

export interface CardCatalogDetail {
  summary: CardCatalogSummary
  brands: string[]
  benefits: CardBenefit[]
  cautions: CardBenefit[]
  topBenefits: CardTagGroup[]
  searchBenefits: CardTagGroup[]
}

export interface CardCatalogSearchParams {
  keyword?: string
  cardType?: CardType
  benefitType?: CardBenefitType
  includeDiscontinued?: boolean
  page?: number
  size?: number
}

export interface CardPerformance {
  assetRowId: number
  yearMonth: string
  requiredAmount: number
  requiredText: string | null
  isRequired: boolean
  currentAmount: number
  achievementRate: number
  isAchieved: boolean
  remainingAmount: number | null
}

export interface CardBenefitCategoryMapping {
  rowId: number
  benefitCategory: string
  expenseCategoryRowId: number
  expenseCategoryName: string
  isCustom: boolean
}

export interface CardBenefitMappingUpsertValues {
  benefitCategory: string
  expenseCategoryRowId: number
}

/**
 * Page 응답 (백엔드 PageResponse)
 */
export interface PageMeta {
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  hasNext: boolean
  hasPrevious: boolean
}

export interface PageResponse<T> {
  content: T[]
  meta: PageMeta
}
