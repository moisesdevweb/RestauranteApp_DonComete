'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, UtensilsCrossed, List, CalendarDays,
  BarChart2, Users, TableProperties, LogOut, ChefHat,
  ChevronLeft, ChevronRight, Tag, QrCode, ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const navItems = [
  { href: '/admin',            label: 'Dashboard',          icono: LayoutDashboard },
  { href: '/admin/menu',       label: 'Gestión de Menú',    icono: UtensilsCrossed },
  { href: '/admin/categorias', label: 'Categorías',          icono: List },
  { href: '/admin/menu-diario',label: 'Menú Diario',         icono: CalendarDays },
  { href: '/admin/reportes',   label: 'Reportes de Ventas',  icono: BarChart2 },
  { href: '/admin/usuarios',   label: 'Gestión de Usuarios', icono: Users },
  { href: '/admin/mesas',      label: 'Gestión de Mesas',    icono: TableProperties },
  { href: '/admin/descuentos',  label: 'Códigos Descuento',   icono: Tag            },
  { href: '/admin/config-qr',   label: 'QR de Pago',           icono: QrCode         },
  { href: '/admin/audit-log',   label: 'Log de Auditoría',    icono: ClipboardList  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); router.push('/login'); };
  const inicial = user?.nombre?.charAt(0).toUpperCase() ?? 'A';

  return (
    <aside className={`
      relative flex flex-col h-screen bg-[#0d1117] border-r border-white/8
      transition-all duration-300 flex-shrink-0
      ${collapsed ? 'w-[68px]' : 'w-[220px]'}
    `}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <ChefHat size={15} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-white font-bold text-sm leading-none">Admin Panel</div>
            <div className="text-white/30 text-xs mt-0.5">Restaurante</div>
          </div>
        )}
      </div>

      {/* Toggle collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-[#1a1f2e] border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ href, label, icono: Icono }) => {
          const activo = pathname === href ||
            (href !== '/admin' && pathname.startsWith(href + '/'));

          return (
            <Link key={href} href={href}
              title={collapsed ? label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
                ${activo
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }
              `}
            >
              <Icono size={17} className="flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium truncate whitespace-nowrap">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Usuario + Logout */}
      <div className="px-2 pb-4 pt-2 border-t border-white/8 space-y-1">
        {/* Info usuario */}
        <div className={`flex items-center gap-2.5 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
            {inicial}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-white text-xs font-medium truncate">{user?.nombre}</div>
              <div className="text-white/30 text-xs">Admin</div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          title={collapsed ? 'Cerrar Sesión' : undefined}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-xl
            text-white/40 hover:text-white hover:bg-white/5
            transition-colors cursor-pointer
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );












  
}