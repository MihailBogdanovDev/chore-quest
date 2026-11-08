import type { Category, Purchase, Quest, Repeat, Reward } from '../core'
import { supabase, unwrap, unwrapMaybe } from './client'
import {
  toFamily,
  toMember,
  toPurchase,
  toQuest,
  toReward,
  type Family,
  type KidOption,
  type Member,
} from './mappers'

/** The signed-in user's member row, or null before they create or join a family. */
export async function getMe(): Promise<Member | null> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const row = unwrapMaybe(await supabase.from('members').select().eq('user_id', auth.user.id).maybeSingle())
  return row ? toMember(row) : null
}

export async function getFamily(): Promise<Family> {
  return toFamily(unwrap(await supabase.from('families').select().single()))
}

export async function listKids(): Promise<Member[]> {
  const rows = unwrap(await supabase.from('members').select().eq('role', 'kid').order('created_at'))
  return rows.map(toMember)
}

export async function createFamily(familyName: string, parentName: string): Promise<void> {
  unwrap(await supabase.rpc('create_family', { family_name: familyName, parent_name: parentName }))
}

export async function addKid(name: string, avatar: string): Promise<void> {
  unwrap(await supabase.rpc('add_kid', { kid_name: name, kid_avatar: avatar }))
}

export async function findKids(code: string): Promise<KidOption[]> {
  const rows = unwrap(await supabase.rpc('family_kids', { code }))
  return rows.map((r) => ({ id: r.id, displayName: r.display_name, avatar: r.avatar }))
}

export async function joinFamily(code: string, kidId: string): Promise<void> {
  unwrap(await supabase.rpc('join_family', { code, kid_id: kidId }))
}

export async function listQuests(kidId: string): Promise<Quest[]> {
  const rows = unwrap(await supabase.from('quests').select().eq('kid_id', kidId).order('created_at'))
  return rows.map(toQuest)
}

/** Every quest in the family that is still alive (open or claimed). */
export async function listFamilyQuests(): Promise<Quest[]> {
  const rows = unwrap(await supabase.from('quests').select().neq('status', 'done').order('created_at'))
  return rows.map(toQuest)
}

export async function claimQuest(questId: string): Promise<void> {
  unwrap(await supabase.rpc('claim_quest', { quest_id: questId }))
}

export async function reviewClaim(questId: string, approve: boolean): Promise<void> {
  unwrap(await supabase.rpc('review_claim', { quest_id: questId, approve }))
}

export interface NewQuest {
  kidId: string
  title: string
  category: Category
  gold: number
  repeat: Repeat
  dueAt?: number
}

export async function createQuest(input: NewQuest): Promise<void> {
  const me = await getMe()
  if (!me) throw new Error('not signed in')
  unwrap(
    await supabase.from('quests').insert({
      family_id: me.familyId,
      kid_id: input.kidId,
      title: input.title,
      category: input.category,
      gold: input.gold,
      repeat: input.repeat,
      ...(input.dueAt === undefined ? {} : { due_at: new Date(input.dueAt).toISOString() }),
    }),
    { allowEmpty: true },
  )
}

export async function listRewards(): Promise<Reward[]> {
  const rows = unwrap(await supabase.from('rewards').select().order('created_at'))
  return rows.map(toReward)
}

export async function saveReward(input: {
  id?: string
  name: string
  icon: string
  price: number
  active: boolean
}): Promise<void> {
  const { id, ...fields } = input
  if (id) {
    unwrap(await supabase.from('rewards').update(fields).eq('id', id), { allowEmpty: true })
    return
  }
  const me = await getMe()
  if (!me) throw new Error('not signed in')
  unwrap(await supabase.from('rewards').insert({ ...fields, family_id: me.familyId }), { allowEmpty: true })
}

/** Purchases, newest first. A kid only needs their own; RLS shows the whole family to parents. */
export async function listPurchases(kidId?: string): Promise<Purchase[]> {
  let query = supabase.from('purchases').select()
  if (kidId) query = query.eq('kid_id', kidId)
  return unwrap(await query.order('created_at', { ascending: false })).map(toPurchase)
}

/** Returns the new purchase id. */
export async function buyReward(rewardId: string): Promise<string> {
  return unwrap(await supabase.rpc('buy_reward', { reward_id: rewardId }))
}

export async function deliverPurchase(purchaseId: string): Promise<void> {
  unwrap(await supabase.rpc('deliver_purchase', { purchase_id: purchaseId }))
}
