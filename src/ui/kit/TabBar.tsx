import { Icon } from './Icon';
import { sfx } from './sfx';

export type TabItem = { id: string; label: string; icon: string; badge?: number };
type Props = { items: TabItem[]; active: string; onChange: (id: string) => void };

export function TabBar({ items, active, onChange }: Props) {
  return (
    <>
      <div className="px-tabs-spacer" />
      <nav className="px-tabs">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            className={`px-tabs__item${it.id === active ? ' is-active' : ''}`}
            onClick={() => {
              sfx.click();
              onChange(it.id);
            }}
          >
            <Icon name={it.icon} size={28} alt="" />
            <span>{it.label}</span>
            {!!it.badge && <span className="px-badge">{it.badge > 99 ? '99+' : it.badge}</span>}
          </button>
        ))}
      </nav>
    </>
  );
}
