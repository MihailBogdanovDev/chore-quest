import { HOUR, type Quest } from '../core'

/** Demo family state until Supabase is wired up (issue #6). */
export function mockQuests(now: number): Quest[] {
  return [
    {
      id: 'laundry', title: 'Put away laundry', category: 'laundry', size: 'M',
      createdAt: now - 30 * HOUR, dueAt: now - 6 * HOUR,
      status: 'done', claimedAt: now - 27 * HOUR, approvedAt: now - 26 * HOUR,
    },
    {
      id: 'room', title: 'Clean your room', category: 'room', size: 'L',
      createdAt: now - 5 * HOUR, dueAt: now + 19 * HOUR,
      status: 'open', claimedAt: null, approvedAt: null,
    },
    {
      id: 'dishes', title: 'Do the dishes', category: 'dishes', size: 'S',
      createdAt: now - 2 * HOUR, dueAt: now + 3 * HOUR,
      status: 'open', claimedAt: null, approvedAt: null,
    },
    {
      id: 'trash', title: 'Take out the trash', category: 'trash', size: 'M',
      createdAt: now - HOUR, dueAt: now + 23 * HOUR,
      status: 'claimed', claimedAt: now - HOUR / 2, approvedAt: null,
    },
  ]
}
