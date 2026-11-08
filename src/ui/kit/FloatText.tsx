import { useEffect } from 'react';

type Props = { text: string; x?: number; y?: number; color?: string; onDone?: () => void };

/** Floating "+25" that rises and fades. x/y are viewport px (default: center-ish). Mount to show; onDone fires after animation. */
export function FloatText({ text, x, y, color, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 1100);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="px-float"
      style={{ left: x ?? '50%', top: y ?? '40%', color }}
    >
      {text}
    </div>
  );
}
