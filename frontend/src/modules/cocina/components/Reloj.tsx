'use client';
import { useEffect, useState } from 'react';

export function Reloj() {
  const [hora, setHora] = useState('');
  const [fecha, setFecha] = useState('');

  useEffect(() => {
    const actualizar = () => {
      const ahora = new Date();
      setHora(ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }));
      setFecha(ahora.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }));
    };
    actualizar();
    const interval = setInterval(actualizar, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-right">
      <div className="text-orange-400 font-bold text-xl leading-none">{hora}</div>
      <div className="text-white/40 text-xs capitalize">{fecha}</div>
    </div>
  );
}
