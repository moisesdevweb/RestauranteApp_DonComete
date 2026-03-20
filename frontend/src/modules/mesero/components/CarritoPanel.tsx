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

        {/* Historial — items ya enviados a cocina, agrupados por producto+comensal+nota */}
        {ordenCreada && itemsYaEnviados.length > 0 && (() => {
          // Agrupar filas del mismo producto para el mismo comensal con la misma nota
          // Un Americano x3 muestra "3x Americano" en lugar de 3 filas separadas
          type ItemAgrupado = {
            key: string;
            nombre: string;
            comensal: number;
            nota: string | null;
            cantidad: number;
            estado: 'pendiente' | 'listo';
            precioUnitario: number;
          };
          const agrupados = itemsYaEnviados.reduce<ItemAgrupado[]>((acc, item) => {
            const key = `${item.nombreProducto}|${item.numeroComensal}|${item.nota ?? ''}`;
            const existe = acc.find(a => a.key === key);
            if (existe) {
              existe.cantidad += item.cantidad;
              // Si cualquiera está pendiente, el grupo está pendiente
              if (item.estado === 'pendiente') existe.estado = 'pendiente';
            } else {
              acc.push({
                key,
                nombre:          item.nombreProducto,
                comensal:        item.numeroComensal,
                nota:            item.nota ?? null,
                cantidad:        item.cantidad,
                estado:          item.estado,
                precioUnitario:  Number(item.precioUnitario),
              });
            }
            return acc;
          }, []);

          return (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={13} className="text-white/30" />
                <span className="text-white/30 text-xs uppercase tracking-wider">Ya en cocina</span>
              </div>
              <div className="space-y-2">
                {agrupados.map(item => (
                  <div key={item.key} className="bg-[#1e2530] border border-white/5 rounded-xl p-3 opacity-70">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          {item.cantidad > 1 && (
                            <span className="text-orange-400 text-xs font-bold bg-orange-500/15 px-1.5 py-0.5 rounded-md">
                              {item.cantidad}x
                            </span>
                          )}
                          <span className="text-white/70 text-sm">{item.nombre}</span>
                        </div>
                        <div className="text-white/30 text-xs mt-0.5">Comensal {item.comensal}</div>
                        {item.nota && item.nota.includes('|') ? (
                          <div className="text-orange-400/50 text-xs mt-0.5">📝 {item.nota.split('|')[1]?.trim()}</div>
                        ) : item.nota ? (
                          <div className="text-orange-400/50 text-xs mt-0.5">📝 {item.nota}</div>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                          item.estado === 'listo'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {item.estado === 'listo' ? '✓ Listo' : '⏳ En cocina'}
                        </span>
                        <span className="text-white/20 text-xs">
                          S/. {(item.precioUnitario * item.cantidad).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

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

        {/* Botón cobrar — siempre visible cuando hay orden, opaco hasta que todo esté listo */}
        {ordenCreada && itemsYaEnviados.length > 0 && (
          <button
            onClick={puedeCobrar ? onCobrar : undefined}
            disabled={!puedeCobrar}
            className={`w-full font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              puedeCobrar
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer shadow-lg shadow-emerald-500/30'
                : 'bg-[#2a3040] text-white/30 cursor-not-allowed border border-white/10'
            }`}
          >
            <CheckCircle size={18} />
            {puedeCobrar ? 'Cobrar Mesa' : 'Esperando cocina...'}
          </button>
        )}
      </div>
    </div>
  );
}