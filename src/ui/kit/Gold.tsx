import { Icon } from './Icon';

type Props = { amount: number; size?: number; className?: string };

export function Gold({ amount, size = 20, className = '' }: Props) {
  return (
    <span className={`px-gold ${className}`}>
      <Icon name="coin" size={size} alt="gold" />
      <span>{amount.toLocaleString()}</span>
    </span>
  );
}
