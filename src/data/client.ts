import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_KEY. Copy .env.example to .env.local.')
}

export const supabase = createClient<Database>(url, key)

type Result<T> = { data: T | null; error: { message: string } | null }

/** Unwraps a Supabase result, turning its error into a thrown Error. */
export function unwrap<T>(res: Result<T>): T {
  if (res.error) throw new Error(res.error.message)
  if (res.data === null) throw new Error('No data returned')
  return res.data
}

/** Like unwrap, for queries where no row is a valid answer. */
export function unwrapMaybe<T>(res: Result<T>): T | null {
  if (res.error) throw new Error(res.error.message)
  return res.data
}
