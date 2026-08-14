export type SplitMethod = 'EQUAL' | 'CUSTOM' | 'RATIO'

export interface DutchPayParticipant {
  rowId: number
  userRowId: number | null
  participantName: string
  amount: number
  /** 이 사람이 결제했는가. 한 정산에 한 명 — 나머지는 그 사람에게 갚을 참여자다. */
  isPayer: boolean
  isPaid: boolean
  paidAt: string | null
}

export interface DutchPay {
  rowId: number
  userRowId: number
  sourceExpenseRowId: number | null
  title: string
  description: string | null
  totalAmount: number
  currency: string
  splitMethod: SplitMethod
  dutchPayDate: string
  isSettled: boolean
  participants: DutchPayParticipant[]
  createAt: string
  modifyAt: string
}

export interface DutchPayFormValues {
  sourceExpenseRowId?: number
  title: string
  description?: string
  totalAmount: number
  currency?: string
  splitMethod: SplitMethod
  dutchPayDate: string
  participants: ParticipantFormValues[]
}

export interface ParticipantFormValues {
  userRowId?: number | null
  participantName: string
  amount: number
  /** 이 사람이 결제했는가. 안 보내면 서버가 첫 사람을 결제자로 본다. */
  isPayer?: boolean
}
