'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterStatusProps {
  value: 'todos' | 'activos' | 'inactivos';
  onChange: (value: 'todos' | 'activos' | 'inactivos') => void;
}

export function FilterStatus({ value, onChange }: FilterStatusProps) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAbierto(false);
      }
    }

    if (abierto) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [abierto]);

  const handleToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setAbierto(!abierto);
  };

  const handleSelect = (nuevoValor: 'todos' | 'activos' | 'inactivos') => {
    onChange(nuevoValor);
    setAbierto(false);
  };

  const labels: Record<string, string> = {
    todos: 'Todos los estados',
    activos: 'Activos',
    inactivos: 'Inactivos',
  };

  const opciones = [
    { valor: 'todos' as const, label: 'Todos los estados' },
    { valor: 'activos' as const, label: 'Activos' },
    { valor: 'inactivos' as const, label: 'Inactivos' },
  ];

  return (
    <div ref={ref} className="relative w-48">
      <button
        onClick={handleToggle}
        onMouseDown={(e) => e.preventDefault()}
        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm
                   flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer
                   focus:outline-none focus:ring-2 focus:ring-orange-500/50"
      >
        <span>{labels[value]}</span>
        <ChevronDown size={16} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#252d3d] border border-white/10 rounded-xl shadow-lg z-50">
          {opciones.map(opcion => (
            <button
              key={opcion.valor}
              onClick={() => handleSelect(opcion.valor)}
              onMouseDown={(e) => e.preventDefault()}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
                           ${value === opcion.valor
                             ? 'bg-orange-500/20 text-orange-400 border-l-2 border-orange-500'
                             : 'text-white/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                           }`}
            >
              {opcion.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
