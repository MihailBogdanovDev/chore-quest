import { monsterFor, pointsAt } from '../core'
import type { FamilyQuest, Member } from '../data'

interface Props {
  quests: FamilyQuest[]
  kids: Member[]
  now: number
}

/** Open quests: which monster is attacking whom, and what it is worth right now. */
export function QuestBoard({ quests, kids, now }: Props) {
  const open = quests.filter((q) => q.status === 'open')
  const name = (id: string) => kids.find((k) => k.id === id)?.displayName ?? '?'

  if (open.length === 0) return <p>No monsters out there</p>

  return (
    <ul className="row-list">
      {open.map((q) => (
        <li key={q.id}>
          <span>
            <strong>{monsterFor(q.category, q.size).name}</strong> → {name(q.kidId)} · {q.title}
          </span>
          <span className="tag">{pointsAt(q, now)}P</span>
        </li>
      ))}
    </ul>
  )
}
