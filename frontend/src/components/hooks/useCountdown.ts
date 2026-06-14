import { useState, useEffect } from 'react';

interface CountdownState {
  timeLeft: string;
  expired: boolean;
  secondsLeft: number;
}

/**
 * Counts down to a target date/ISO string.
 * Returns { timeLeft: "HH:MM:SS", expired: boolean, secondsLeft: number }
 */
export function useCountdown(endsAt: string | null | undefined): CountdownState {
  function compute(): CountdownState {
    if (!endsAt) return { timeLeft: '—', expired: false, secondsLeft: 0 };
    const diff = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
    if (diff === 0) return { timeLeft: '00:00:00', expired: true, secondsLeft: 0 };
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return { timeLeft: `${pad(h)}:${pad(m)}:${pad(s)}`, expired: false, secondsLeft: diff };
  }

  const [state, setState] = useState<CountdownState>(compute);

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setState(compute()), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt]);

  return state;
}