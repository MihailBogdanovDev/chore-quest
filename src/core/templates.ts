import type { Category } from './types'

export interface ChoreTemplate {
  id: string
  title: string
  category: Category
  /** Icon name: public/art/icons/<icon>.png */
  icon: string
  gold: number
}

export const CHORE_TEMPLATES: ChoreTemplate[] = [
  { id: 'bed', title: 'Make bed', category: 'room', icon: 'bed', gold: 5 },
  { id: 'toys', title: 'Pick up toys', category: 'room', icon: 'toys', gold: 10 },
  { id: 'room', title: 'Tidy room', category: 'room', icon: 'toys', gold: 15 },
  { id: 'dishes', title: 'Dishes', category: 'dishes', icon: 'dishes', gold: 15 },
  { id: 'trash', title: 'Take out trash', category: 'trash', icon: 'trash', gold: 10 },
  { id: 'laundry', title: 'Laundry', category: 'laundry', icon: 'laundry', gold: 20 },
  { id: 'floor', title: 'Vacuum / sweep floor', category: 'room', icon: 'broom', gold: 20 },
  { id: 'pet', title: 'Feed pet', category: 'pets', icon: 'pet', gold: 5 },
  { id: 'homework', title: 'Homework', category: 'homework', icon: 'book', gold: 25 },
  { id: 'custom', title: '', category: 'other', icon: 'sparkle', gold: 10 },
]

export const REWARD_ICONS = ['moon', 'gamepad', 'tv', 'pizza', 'ice-cream', 'tree', 'movie', 'gift', 'crown', 'candy']
