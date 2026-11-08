import { CHORE_TEMPLATES, type Category } from '../../core'

export const heroSrc = (avatar: string) => `/art/heroes/${/^hero-[1-4]$/.test(avatar) ? avatar : 'hero-1'}.png`
export const HEROES = ['hero-1', 'hero-2', 'hero-3', 'hero-4']

export function Hero({ avatar, size = 40 }: { avatar: string; size?: number }) {
  return <img className="hero-img" src={heroSrc(avatar)} width={size} height={size} alt="" draggable={false} />
}

const CAT_ICON: Record<Category, string> = {
  dishes: 'dishes',
  trash: 'trash',
  room: 'toys',
  laundry: 'laundry',
  pets: 'pet',
  homework: 'book',
  other: 'sparkle',
}

/** Icon for a quest: exact template title match, else by category. */
export function questIcon(title: string, category: Category): string {
  return CHORE_TEMPLATES.find((t) => t.title === title)?.icon ?? CAT_ICON[category]
}

export const fmtDue = (dueAt: number, now: number) => {
  const d = new Date(dueAt)
  const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const today = new Date(now).toDateString() === d.toDateString()
  return today ? `Today ${t}` : `${d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })} ${t}`
}

export interface ParentData {
  familyId: string
  kids: import('../../data').Member[]
  quests: import('../../core').Quest[]
  rewards: import('../../core').Reward[]
  purchases: import('../../core').Purchase[]
  done: import('../../core').Quest[]
  inviteCode: string
  reload: () => Promise<void>
}
