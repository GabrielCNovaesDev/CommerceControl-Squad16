import { useCountdown } from '../../hooks/useCountdown';

export function CountdownBadge({ endsAt }: { endsAt: string }) {
  const { timeLeft, expired } = useCountdown(endsAt);
  return (
    <div className={`shrink-0 rounded-xl border px-4 py-2 text-right ${expired ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-100'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tempo restante</p>
      <p className={`text-xl font-mono font-bold tabular-nums mt-0.5 ${expired ? 'text-orange-600' : 'text-blue-700'}`}>
        {expired ? 'Expirado' : timeLeft}
      </p>
    </div>
  );
}
