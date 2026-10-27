/** Matches minimum_password_length in supabase/config.toml and the hosted project. */
export const MIN_PASSWORD_LENGTH = 8

export function checkPassword(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }
}
