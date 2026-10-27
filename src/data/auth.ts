import { supabase } from './client'

export interface Session {
  userId: string
  /** Kid devices sign in anonymously; parents use email. */
  anonymous: boolean
}

export async function sendMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw new Error(error.message)
}

export async function signInAsKid(): Promise<void> {
  const { error } = await supabase.auth.signInAnonymously()
  if (error) throw new Error(error.message)
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

/** Calls back with the current session now and on every change. Returns an unsubscribe function. */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, s) => {
    cb(s ? { userId: s.user.id, anonymous: s.user.is_anonymous ?? false } : null)
  })
  return () => data.subscription.unsubscribe()
}
