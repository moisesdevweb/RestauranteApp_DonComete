'use client';
import { useState } from 'react';                          
import { useParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMesaPedido } from '@/modules/mesero/hooks/useMesaPedido';
import { ModalProducto } from '@/modules/mesero/components/ModalProducto';
import { ModalCobro } from '@/modules/mesero/components/ModalCobro';  
import { MenuDiarioSelector } from '@/modules/mesero/components/MenuDiarioSelector';
import { CarritoPanel } from '@/modules/mesero/components/CarritoPanel';
import { ComensalesBar } from '@/modules/mesero/components/ComensalesBar';
import { motion } from 'framer-motion';

export default function MesaPage() {
  const params = useParams();
  const router = useRouter();
  const mesaId = parseInt(params.id as string);

  const [modalCobro, setModalCobro] = useState(false);   

  // Actualizar stock de productos en tiempo real cuando llega alerta del socket
  // (ya existe el toast en useMesaPedido, aquí solo actualizamos el estado visual)

  const {
    mesa, ordenCreada, enviando, nombreCliente, setNombreCliente,
    comensales, comensalActivo, setComensalActivo,
    numComensales, setNumComensales, itemsYaEnviados,
    categorias, menuHoy, categoriaActiva, setCategoriaActiva,
    tabActivo, setTabActivo, productosFiltrados,
    productoModal, setProductoModal,
    items, totalItems, totalPrecio, itemsPorComensal, quitarItem,
    handleAgregarProducto, handleAgregarMenu, handleEnviarCocina,
    ordenId,                                             
  } = useMesaPedido(mesaId);

  // Total general = lo ya enviado + lo nuevo en carrito
  const totalGeneral =
    itemsYaEnviados.reduce((acc, i) => acc + Number(i.precioUnitario) * i.cantidad, 0)
    + totalPrecio();

  // Puede cobrar si hay orden activa, hay items enviados, y TODOS están listos
  const puedeCobrar =
    ordenCreada &&
    itemsYaEnviados.length > 0 &&
    items.length === 0 && // no hay items sin enviar
    itemsYaEnviados.every(i => i.estado === 'listo');

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col">

      {/* Header — sin cambios */}
      <header className="bg-[#1a1f2e] border-b border-white/10 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => router.push('/mesero')}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-sm font-bold">
            {mesa?.numero}
          </div>
          <div>
            <div className="font-bold text-white leading-none">Mesa {mesa?.numero}</div>
            <div className="text-white/40 text-xs">
              {ordenCreada ? '🟠 Mesa ocupada — Agregar más items' : 'Tomar Pedido'}
            </div>
          </div>
        </div>
        <input
          type="text"
          placeholder="Nombre del cliente (opcional)"
          value={nombreCliente}
          onChange={e => setNombreCliente(e.target.value)}
          className="flex-1 bg-[#2a3040] border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/25 outline-none focus:border-orange-500/50 max-w-xs"
        />
      </header>

      {/* Comensales — sin cambios */}
      <ComensalesBar
        comensales={comensales}
        comensalActivo={comensalActivo}
        numComensales={numComensales}
        ordenCreada={ordenCreada}
        capacidadMesa={mesa?.capacidad || 8}
        itemsPorComensal={itemsPorComensal}
        onCambiarComensal={setComensalActivo}
        onAumentarComensales={() => setNumComensales(Math.min(mesa?.capacidad || 8, numComensales + 1))}
        onDisminuirComensales={() => setNumComensales(Math.max(1, numComensales - 1))}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Tabs carta / menú — sin cambios */}
          <div className="px-4 pt-4 flex gap-2">
            <button
              onClick={() => setTabActivo('carta')}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                tabActivo === 'carta'
                  ? 'bg-orange-500 text-white'
                  : 'bg-[#1a1f2e] text-white/50 border border-white/10 hover:text-white/80'
              }`}
            >
              🍽️ Platos a la Carta
            </button>
            <button
              onClick={() => setTabActivo('menu')}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                tabActivo === 'menu'
                  ? 'bg-orange-500 text-white'
                  : 'bg-[#1a1f2e] text-white/50 border border-white/10 hover:text-white/80'
              }`}
            >
              📋 Menú del Día
              {menuHoy && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  S/. {Number(menuHoy.precio).toFixed(2)}
                </span>
              )}
            </button>
          </div>

          {/* Tab: Carta — sin cambios */}
          {tabActivo === 'carta' && (
            <>
              <div className="px-4 pt-3 flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setCategoriaActiva(null)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    categoriaActiva === null
                      ? 'bg-orange-500 text-white'
                      : 'bg-[#1a1f2e] text-white/50 border border-white/10'
                  }`}
                >
                  Todos
                </button>
                {categorias.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaActiva(cat.id)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      categoriaActiva === cat.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-[#1a1f2e] text-white/50 border border-white/10'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {productosFiltrados.map(producto => (
                  <motion.button
                    key={producto.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => !producto.agotado && setProductoModal(producto)}
                    disabled={producto.agotado}
                    className={`bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden text-left transition-all cursor-pointer hover:border-orange-500/30 ${
                      producto.agotado ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="relative h-32 bg-[#2a3040]">
                      {producto.imagenUrl ? (
                        <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                      )}

                      {/* Overlay agotado */}
                      {producto.agotado && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">AGOTADO</span>
                        </div>
                      )}

                      {/* Badge stock bajo — solo si tiene stock activo y está por debajo del mínimo */}
                      {!producto.agotado && producto.stock !== null && producto.stock !== undefined && producto.stock <= producto.stockMinimo && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Package size={10} /> {producto.stock} uds
                          </span>
                        </div>
                      )}

                      {/* Precio */}
                      <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        S/. {Number(producto.precio).toFixed(2)}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-white font-medium text-sm">{producto.nombre}</div>
                      {producto.descripcion && (
                        <div className="text-white/40 text-xs mt-1 line-clamp-1">{producto.descripcion}</div>
                      )}
                      {/* Stock info sutil debajo del nombre */}
                      {!producto.agotado && producto.stock !== null && producto.stock !== undefined && (
                        <div className={`text-xs mt-1 flex items-center gap-1 ${
                          producto.stock <= producto.stockMinimo
                            ? 'text-yellow-400'
                            : 'text-white/20'
                        }`}>
                          <Package size={10} />
                          {producto.stock <= producto.stockMinimo
                            ? `Solo quedan ${producto.stock}`
                            : `${producto.stock} disponibles`}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </>
          )}

          {/* Tab: Menú del día — sin cambios */}
          {tabActivo === 'menu' && (
            <div className="flex-1 overflow-y-auto p-4">
              {!menuHoy ? (
                <div className="flex items-center justify-center h-40 text-white/30">
                  No hay menú del día disponible
                </div>
              ) : (
                <MenuDiarioSelector menu={menuHoy} onAgregar={handleAgregarMenu} />
              )}
            </div>
          )}
        </div>

        {/* Panel carrito — agrega las 3 props nuevas */}
        <CarritoPanel
          items={items}
          itemsYaEnviados={itemsYaEnviados}
          comensales={comensales}
          ordenCreada={ordenCreada}
          enviando={enviando}
          totalItems={totalItems}
          totalPrecio={totalPrecio}
          totalGeneral={totalGeneral}           
          puedeCobrar={puedeCobrar}            
          onQuitarItem={quitarItem}
          onEnviarCocina={handleEnviarCocina}
          onCobrar={() => setModalCobro(true)}  
        />
      </div>

      {/* Modal producto — sin cambios */}
      <AnimatePresence>
        {productoModal && (
          <ModalProducto
            producto={productoModal}
            onAgregar={(nota) => handleAgregarProducto(productoModal, nota)}
            onCerrar={() => setProductoModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal cobro — pasa la orden completa para la boleta detallada */}
      <AnimatePresence>
        {modalCobro && ordenId && (
          <ModalCobro
            ordenId={ordenId}
            total={totalGeneral}
            mesa={`Mesa ${mesa?.numero}`}
            orden={{
              mesa: { numero: mesa?.numero ?? 0 },
              // Agrupamos itemsYaEnviados por comensal para la boleta
              comensales: comensales.map(c => ({
                numero: c.numero,
                nombre: c.nombre ?? null,
                detalles: itemsYaEnviados
                  .filter(d => d.numeroComensal === c.numero)
                  .map(d => ({
                    id:             d.id,
                    cantidad:       d.cantidad,
                    precioUnitario: Number(d.precioUnitario),
                    nota:           d.nota ?? null,
                    tipo:           d.tipo,
                    producto:       d.producto ? { nombre: d.producto.nombre } : undefined,
                  })),
              })),
            }}
            onCobrado={() => {
              router.push('/mesero');
            }}
            onCerrar={() => setModalCobro(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}