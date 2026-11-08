import type { HTMLAttributes } from 'react';
import './tokens.css';

type Props = HTMLAttributes<HTMLDivElement> & { variant?: 'parchment' | 'wood' | 'paper' };

export function Panel({ variant = 'parchment', className = '', ...rest }: Props) {
  const cls = variant === 'wood' ? 'px-panel px-panel--wood' : variant === 'paper' ? 'px-paper' : 'px-panel';
  return <div className={`${cls} ${className}`} {...rest} />;
}
