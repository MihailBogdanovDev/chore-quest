import type { Quest } from '../core'
import type { Tables } from './database.types'

export interface Member {
  id: string
  familyId: string
  role: 'parent' | 'kid'
  displayName: string
  avatar: string
  lifetimePoints: number
  walletPoints: number
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
    title: row.title,
    category: row.category,
    size: row.size,
    createdAt: ms(row.created_at),
    dueAt: ms(row.due_at),
    status: row.status,
    claimedAt: msOrNull(row.claimed_at),
    approvedAt: msOrNull(row.approved_at),
  }
}

export function toMember(row: Tables<'members'>): Member {
  return {
    id: row.id,
    familyId: row.family_id,
    role: row.role,
    displayName: row.display_name,
    avatar: row.avatar,
    lifetimePoints: row.lifetime_points,
    walletPoints: row.wallet_points,
    joined: row.user_id !== null,
  }
}

export function toFamily(row: Tables<'families'>): Family {
  return { id: row.id, name: row.name, inviteCode: row.invite_code }
}
