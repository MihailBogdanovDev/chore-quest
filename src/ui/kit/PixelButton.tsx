import type { ButtonHTMLAttributes } from 'react';
import { sfx } from './sfx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'wood' | 'gold' | 'green' | 'red' | 'ghost';
  block?: boolean;
  silent?: boolean;
};

export function PixelButton({ variant = 'wood', block, silent, className = '', onClick, type = 'button', ...rest }: Props) {
  const v = variant === 'wood' ? '' : ` px-btn--${variant}`;
  return (
    <button
      type={type}
      className={`px-btn${v}${block ? ' px-btn--block' : ''} ${className}`}
      onClick={(e) => {
        if (!silent) sfx.click();
        onClick?.(e);
      }}
      {...rest}
    />
  );
}
