import { create } from 'zustand';

export interface ItemCarrito {
  id: string;
  comensalId: number;
  tipo: 'carta' | 'menu_dia';
  productoId?: number;
  menuDiarioId?: number;
  nombre: string;
  precio: number;
  cantidad: number;
  nota?: string;
}

interface PedidoStore {
  ordenId: number | null;
  items: ItemCarrito[];
  setOrdenId: (id: number) => void;
  agregarItem: (item: Omit<ItemCarrito, 'id'>) => void;
  quitarItem: (id: string) => void;
  limpiarItems: () => void;
  limpiar: () => void;
  totalItems: () => number;
  totalPrecio: () => number;
  itemsPorComensal: (comensalId: number) => ItemCarrito[];
}

export const usePedidoStore = create<PedidoStore>((set, get) => ({
  ordenId: null,
  items: [],

  setOrdenId: (id) => set({ ordenId: id }),

  agregarItem: (item) => {
    const nuevoItem: ItemCarrito = {
      ...item,
      id: `${item.comensalId}-${item.productoId ?? item.menuDiarioId}-${Date.now()}`,
    };
    set(state => ({ items: [...state.items, nuevoItem] }));
  },

  quitarItem: (id) =>
    set(state => ({ items: state.items.filter(i => i.id !== id) })),

  limpiarItems: () => set({ items: [] }),

  limpiar: () => set({ ordenId: null, items: [] }),

  totalItems: () => get().items.reduce((sum, i) => sum + i.cantidad, 0),

  totalPrecio: () => get().items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),

  itemsPorComensal: (comensalId) =>
    get().items.filter(i => i.comensalId === comensalId),
}));
