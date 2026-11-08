import { monsterFor, type Quest } from '../core'
import type { Member } from '../data'

interface Props {
  quests: Quest[]
  kids: Member[]
  now?: number
}

/** Open quests: which monster is attacking whom, and what it is worth right now. */
export function QuestBoard({ quests, kids }: Props) {
  const open = quests.filter((q) => q.status === 'open')
  const name = (id: string) => kids.find((k) => k.id === id)?.displayName ?? '?'

  if (open.length === 0) return <p>No monsters out there</p>

  return (
    <ul className="row-list">
      {open.map((q) => (
        <li key={q.id}>
          <span>
            <strong>{monsterFor(q.category, q.gold).name}</strong> → {name(q.kidId)} · {q.title}
          </span>
          <span className="tag">{q.gold}G</span>
        </li>
      ))}
    </ul>
  )
}
