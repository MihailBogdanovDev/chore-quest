import { supabase } from './client'

/**
 * Calls `onChange` whenever a quest or member row in the family changes.
 * Callers reload from the database rather than patching state from payloads.
 */
export function subscribeFamily(familyId: string, onChange: () => void): () => void {
  const filter = `family_id=eq.${familyId}`
  const channel = supabase
    .channel(`family:${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'quests', filter }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'members', filter }, onChange)
    .subscribe()
  return () => {
    void supabase.removeChannel(channel)
  }
}
