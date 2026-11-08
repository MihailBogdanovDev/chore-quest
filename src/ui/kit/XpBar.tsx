type Props = { level: number; title?: string; current: number; needed: number; className?: string };

export function XpBar({ level, title, current, needed, className = '' }: Props) {
  const pct = needed > 0 ? Math.max(0, Math.min(100, (current / needed) * 100)) : 0;
  return (
    <div className={`px-xp ${className}`}>
      <div className="px-xp__row">
        <span className="px-xp__lv">LV {level}</span>
        {title && <span>{title}</span>}
        <span className="px-xp__num">{current}/{needed} XP</span>
      </div>
      <div className="px-bar" role="progressbar" aria-valuenow={current} aria-valuemax={needed}>
        <div className="px-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
