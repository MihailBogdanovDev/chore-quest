import { supabase } from './client'

export interface Session {
  userId: string
  /** Kid devices sign in anonymously; parents use email and password. */
  anonymous: boolean
  /** Set when the user arrived through a password reset link. */
  recovery?: true
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

/** Creates a parent account. With email confirmation on, there is no session until the link is clicked. */
export async function signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw new Error(error.message)
  return { needsConfirmation: data.session === null }
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
  if (error) throw new Error(error.message)
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(error.message)
}

export async function signInAsKid(): Promise<void> {
  const { error } = await supabase.auth.signInAnonymously()
  if (error) throw new Error(error.message)
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
  // The service worker keeps family data for offline use; it must not outlive the session.
  if ('caches' in window) await caches.delete('supabase-api')
}

/** Calls back with the current session now and on every change. Returns an unsubscribe function. */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, s) => {
    if (!s) return cb(null)
    const session: Session = { userId: s.user.id, anonymous: s.user.is_anonymous ?? false }
    if (event === 'PASSWORD_RECOVERY') session.recovery = true
    cb(session)
  })
  return () => data.subscription.unsubscribe()
}
