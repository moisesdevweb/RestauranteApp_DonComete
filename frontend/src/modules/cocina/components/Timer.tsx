'use client';
import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  desde: string;
}

export function Timer({ desde }: TimerProps) {
  const [minutos, setMinutos] = useState(0);

  useEffect(() => {
    const calcular = () => {
      const diff = Date.now() - new Date(desde).getTime();
      setMinutos(Math.floor(diff / 60000));
    };
    calcular();
    const interval = setInterval(calcular, 30000);
    return () => clearInterval(interval);
  }, [desde]);

  const color = minutos < 10
    ? 'text-green-400'
    : minutos < 20
    ? 'text-yellow-400'
    : 'text-red-400';

  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Clock size={12} />
      {minutos === 0 ? 'Ahora' : `${minutos} min`}
    </span>
  );
}
