'use client';
import { ShoppingCart, Send, Trash2, Clock, CheckCircle } from 'lucide-react';
import { ItemCarrito } from '@/modules/mesero/store/pedido.store';
import { Comensal, DetalleOrden } from '@/types';

interface CarritoPanelProps {
  items: ItemCarrito[];
  itemsYaEnviados: (DetalleOrden & { nombreProducto: string; numeroComensal: number })[];
  comensales: Comensal[];
  ordenCreada: boolean;
  enviando: boolean;
  totalGeneral:  number;  // suma de items ya enviados + nuevos
  puedeCobrar:   boolean; // true si hay orden y todos los items están listos o ya enviados
  totalItems: () => number;
  totalPrecio: () => number;
  onQuitarItem: (id: string) => void;
  onEnviarCocina: () => void;
  onCobrar:      () => void;
  
}
export function CarritoPanel({
  items,
  itemsYaEnviados,
  comensales,
  ordenCreada,
  enviando,
  totalGeneral,   
  puedeCobrar,    
  totalItems,
  totalPrecio,
  onQuitarItem,
  onEnviarCocina,
  onCobrar,       
}: CarritoPanelProps) {

  return (
    <div className="hidden md:flex w-80 bg-[#1a1f2e] border-l border-white/10 flex-col">

      {/* Header carrito */}
      <div className="p-4 border-b border-white/10 flex items-center gap-2">
        <ShoppingCart size={18} className="text-orange-400" />
        <span className="text-white font-semibold">Pedido</span>
        <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
          {totalItems()}
        </span>
      </div>

      {/* Lista de items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Historial — items ya enviados a cocina */}
        {ordenCreada && itemsYaEnviados.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={13} className="text-white/30" />
              <span className="text-white/30 text-xs uppercase tracking-wider">Ya en cocina</span>
            </div>
            <div className="space-y-2">
              {itemsYaEnviados.map(item => (
                <div key={item.id} className="bg-[#1e2530] border border-white/5 rounded-xl p-3 opacity-60">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="text-white/70 text-sm">{item.nombreProducto}</div>
                      <div className="text-white/30 text-xs">Comensal {item.numeroComensal}</div>
                      {item.nota && (
                        <div className="text-orange-400/50 text-xs mt-0.5">📝 {item.nota}</div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      item.estado === 'listo'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {item.estado === 'listo' ? '✓ Listo' : '⏳ En cocina'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Separador nuevos / ya enviados */}
        {ordenCreada && itemsYaEnviados.length > 0 && items.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">Nuevos</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        )}

        {/* Nuevos items por enviar */}
        {items.length === 0 && !ordenCreada ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/20">
            <ShoppingCart size={36} className="mb-2" />
            <p className="text-sm">El carrito está vacío</p>
          </div>
        ) : items.length === 0 && ordenCreada ? (
          <div className="flex flex-col items-center justify-center h-20 text-white/20">
            <p className="text-sm text-center">Agrega más items para enviar a cocina</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="bg-[#2a3040] border border-orange-500/20 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{item.nombre}</div>
                  <div className="text-white/40 text-xs">
                    Comensal {comensales.findIndex(c => c.id === item.comensalId) + 1}
                  </div>
                  {item.nota && (
                    <div className="text-orange-400/70 text-xs mt-1">📝 {item.nota}</div>
                  )}
                </div>
                <button
                  onClick={() => onQuitarItem(item.id)}
                  className="text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mt-2">
                <span className="text-orange-400 text-sm font-semibold">
                  S/. {(item.precio * item.cantidad).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total y botón enviar */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {items.length > 0 && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/60 text-sm">Nuevos items:</span>
            <span className="text-orange-400 font-bold">S/. {totalPrecio().toFixed(2)}</span>
          </div>
        )}

        {/* Total general */}
        {ordenCreada && (
          <div className="flex items-center justify-between py-2 border-t border-white/10">
            <span className="text-white/80 text-sm font-medium">Total mesa:</span>
            <span className="text-white font-bold text-lg">S/. {totalGeneral.toFixed(2)}</span>
          </div>
        )}

        {/* Botón enviar cocina */}
        <button
          onClick={onEnviarCocina}
          disabled={enviando || items.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
          {enviando
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Send size={18} />{ordenCreada ? 'Enviar Nuevos a Cocina' : 'Enviar a Cocina'}</>
          }
        </button>

        {/* Botón cobrar — aparece cuando hay orden activa */}
        {puedeCobrar && (
          <button onClick={onCobrar}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
            <CheckCircle size={18} /> Cobrar Mesa
          </button>
        )}
      </div>
    </div>
  );
}
