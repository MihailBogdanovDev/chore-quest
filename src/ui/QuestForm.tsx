import { useState, type FormEvent } from 'react'
import { HOUR, monsterFor, type Category, type Size } from '../core'
import type { Member, NewQuest } from '../data'
import { useAction } from './useAction'

const CATEGORIES: Category[] = ['dishes', 'trash', 'room', 'laundry', 'pets', 'homework', 'other']
const SIZES: [Size, string][] = [
  ['S', 'Small'],
  ['M', 'Medium'],
  ['L', 'Boss'],
]
const DUE_HOURS = [2, 6, 12, 24, 48]

interface Props {
  kids: Member[]
  now: number
  onPost: (quest: NewQuest) => Promise<void>
}

export function QuestForm({ kids, now, onPost }: Props) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('dishes')
  const [size, setSize] = useState<Size>('M')
  const [kidId, setKidId] = useState(kids[0]?.id ?? '')
  const [dueHours, setDueHours] = useState(24)
  const { run, busy, error } = useAction()

  if (kids.length === 0) return <p>Add a kid first</p>

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await onPost({ kidId: kidId || kids[0].id, title, category, size, dueAt: now + dueHours * HOUR })
      setTitle('')
    })
  }

  return (
    <form className="stack" onSubmit={submit}>
      <label>
        Quest
        <input required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        Chore type
        <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c} · {monsterFor(c, 'M').name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Size
        <select value={size} onChange={(e) => setSize(e.target.value as Size)}>
          {SIZES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        For
        <select value={kidId} onChange={(e) => setKidId(e.target.value)}>
          {kids.map((k) => (
            <option key={k.id} value={k.id}>
              {k.displayName}
            </option>
          ))}
        </select>
      </label>
      <label>
        Due in
        <select value={dueHours} onChange={(e) => setDueHours(Number(e.target.value))}>
          {DUE_HOURS.map((h) => (
            <option key={h} value={h}>
              {h} hours
            </option>
          ))}
        </select>
      </label>
      <button className="big" disabled={busy}>
        Post quest
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  )
}
