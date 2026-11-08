export type Category = 'dishes' | 'trash' | 'room' | 'laundry' | 'pets' | 'homework' | 'other'
export type Size = 'S' | 'M' | 'L'
export type QuestStatus = 'open' | 'claimed' | 'done'
export type Repeat = 'none' | 'daily' | 'weekly'

/** A chore posted by a parent. All timestamps are epoch milliseconds. */
export interface Quest {
  id: string
  kidId: string
  title: string
  category: Category
  gold: number
  repeat: Repeat
  createdAt: number
  dueAt: number
  status: QuestStatus
  claimedAt: number | null
  approvedAt: number | null
  /** Bonus gold from the loot chest dropped on approval, if any. */
  chestGold: number | null
}

export interface Reward {
  id: string
  name: string
  icon: string
  price: number
  active: boolean
}

export interface Purchase {
  id: string
  rewardId: string | null
  kidId: string
  name: string
  icon: string
  price: number
  status: 'pending' | 'delivered'
  createdAt: number
  deliveredAt: number | null
}
