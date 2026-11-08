import type { ReactNode } from 'react';

type Props = { open: boolean; onClose: () => void; title?: string; children: ReactNode; className?: string };

export function Sheet({ open, onClose, title, children, className = '' }: Props) {
  if (!open) return null;
  return (
    <div className="px-backdrop" onClick={onClose}>
      <div className={`px-panel px-sheet ${className}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {title && <h2 className="px-sheet__title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
export const Modal = Sheet;
