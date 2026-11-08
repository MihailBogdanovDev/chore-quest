import type { Purchase, Quest, Reward } from '../core'
import type { Tables } from './database.types'

export interface Member {
  id: string
  familyId: string
  role: 'parent' | 'kid'
  displayName: string
  avatar: string
  /** XP: lifetime_points. Never goes down. */
  xp: number
  /** Gold: wallet_points. Spent at the merchant. */
  gold: number
  streak: number
  bestStreak: number
  approvalsCount: number
  /** A device is bound to this member. Always true for parents. */
  joined: boolean
}

export interface Family {
  id: string
  name: string
  inviteCode: string
}

export interface KidOption {
  id: string
  displayName: string
  avatar: string
}

const ms = (iso: string) => Date.parse(iso)
const msOrNull = (iso: string | null) => (iso === null ? null : ms(iso))

export function toQuest(row: Tables<'quests'>): Quest {
  return {
    id: row.id,
    kidId: row.kid_id,
    title: row.title,
    category: row.category,
    gold: row.gold,
    repeat: row.repeat,
    createdAt: ms(row.created_at),
    dueAt: ms(row.due_at),
    status: row.status,
    claimedAt: msOrNull(row.claimed_at),
    approvedAt: msOrNull(row.approved_at),
    chestGold: row.chest_gold,
  }
}

export function toMember(row: Tables<'members'>): Member {
  return {
    id: row.id,
    familyId: row.family_id,
    role: row.role,
    displayName: row.display_name,
    avatar: row.avatar,
    xp: row.lifetime_points,
    gold: row.wallet_points,
    streak: row.streak,
    bestStreak: row.best_streak,
    approvalsCount: row.approvals_count,
    joined: row.user_id !== null,
  }
}

export function toFamily(row: Tables<'families'>): Family {
  return { id: row.id, name: row.name, inviteCode: row.invite_code }
}

export function toReward(row: Tables<'rewards'>): Reward {
  return { id: row.id, name: row.name, icon: row.icon, price: row.price, active: row.active }
}

export function toPurchase(row: Tables<'purchases'>): Purchase {
  return {
    id: row.id,
    rewardId: row.reward_id,
    kidId: row.kid_id,
    name: row.name,
    icon: row.icon,
    price: row.price,
    status: row.status,
    createdAt: ms(row.created_at),
    deliveredAt: msOrNull(row.delivered_at),
  }
}
