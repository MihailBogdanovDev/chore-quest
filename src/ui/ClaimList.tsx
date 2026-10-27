import { pointsAt } from '../core'
import type { FamilyQuest, Member } from '../data'
import { useAction } from './useAction'

interface Props {
  quests: FamilyQuest[]
  kids: Member[]
  onReview: (questId: string, approve: boolean) => Promise<void>
}

/** Claims waiting for a parent. Points shown are what the kid earns: fixed at claim time. */
export function ClaimList({ quests, kids, onReview }: Props) {
  const { run, busy, error } = useAction()
  const claimed = quests.filter((q) => q.status === 'claimed' && q.claimedAt !== null)
  const name = (id: string) => kids.find((k) => k.id === id)?.displayName ?? '?'

  if (claimed.length === 0) return <p>Nothing to check</p>

  return (
    <>
      <ul className="row-list">
        {claimed.map((q) => (
          <li key={q.id}>
            <span>
              <strong>{name(q.kidId)}</strong> · {q.title} · {pointsAt(q, q.claimedAt!)}P
            </span>
            <span className="actions">
              <button className="ok" disabled={busy} onClick={() => run(() => onReview(q.id, true))}>
                Approve
              </button>
              <button className="no" disabled={busy} onClick={() => run(() => onReview(q.id, false))}>
                Reject
              </button>
            </span>
          </li>
        ))}
      </ul>
      {error && <p role="alert">{error}</p>}
    </>
  )
}
