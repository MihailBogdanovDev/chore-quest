export type Category = 'dishes' | 'trash' | 'room' | 'laundry' | 'pets' | 'homework' | 'other'
export type Size = 'S' | 'M' | 'L'
export type QuestStatus = 'open' | 'claimed' | 'done'

/** A chore posted by a parent. All timestamps are epoch milliseconds. */
export interface Quest {
  id: string
  title: string
  category: Category
  size: Size
  createdAt: number
  dueAt: number
  status: QuestStatus
  claimedAt: number | null
  approvedAt: number | null
}
