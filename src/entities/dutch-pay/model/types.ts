export type SplitMethod = 'EQUAL' | 'CUSTOM' | 'RATIO'

export interface DutchPayParticipant {
  rowId: number
  participantName: string
  amount: number
  isPaid: boolean
  paidAt: string | null
}

export interface DutchPay {
  rowId: number
  userRowId: number
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
  title: string
  description?: string
  totalAmount: number
  currency?: string
  splitMethod: SplitMethod
  dutchPayDate: string
  participants: ParticipantFormValues[]
}

export interface ParticipantFormValues {
  participantName: string
  amount: number
}
