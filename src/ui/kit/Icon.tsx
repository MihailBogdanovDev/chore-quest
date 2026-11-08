import type { CSSProperties } from 'react';

type Props = { name: string; size?: number; alt?: string; className?: string; style?: CSSProperties };

export function Icon({ name, size = 32, alt = '', className, style }: Props) {
  return (
    <img
      src={`/art/icons/${name}.png`}
      width={size}
      height={size}
      alt={alt}
      draggable={false}
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    />
  );
}
