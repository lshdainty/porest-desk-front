export type SplitMethod = 'EQUAL' | 'CUSTOM' | 'RATIO'

export interface DutchPayParticipant {
  rowId: number
  userRowId: number | null
  participantName: string
  amount: number
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
}
