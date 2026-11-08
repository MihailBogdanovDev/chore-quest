import { supabase } from './client'

/**
 * Calls `onChange` whenever a quest, member, reward or purchase row in the family changes.
 * Callers reload from the database rather than patching state from payloads.
 */
export function subscribeFamily(familyId: string, onChange: () => void): () => void {
  const filter = `family_id=eq.${familyId}`
  const channel = supabase
    .channel(`family:${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'quests', filter }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'members', filter }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards', filter }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases', filter }, onChange)
    .subscribe()
  return () => {
    void supabase.removeChannel(channel)
  }
}
