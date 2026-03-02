import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rutasProtegidas: Record<string, string[]> = {
  '/admin': ['admin'],
  '/mesero': ['mesero', 'admin'],
  '/cocina': ['cocina', 'admin'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Buscar qué ruta protegida aplica
  const rutaBase = Object.keys(rutasProtegidas).find(ruta =>
    pathname.startsWith(ruta)
  );

  if (!rutaBase) return NextResponse.next();

  // Leer token del localStorage (enviado en cookie por Zustand persist)
  const authStorage = request.cookies.get('auth-storage')?.value;

  if (!authStorage) {
    console.warn('⚠️ Sin auth-storage, redirigiendo a login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const parsed = JSON.parse(authStorage);
    const token = parsed?.state?.token;
    const rol = parsed?.state?.user?.rol;

    if (!token || !rol) {
      console.warn('⚠️ Token o rol faltante');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verificar que el rol tiene acceso
    const rolesPermitidos = rutasProtegidas[rutaBase];
    if (!rolesPermitidos.includes(rol)) {
      console.warn(`⚠️ Rol ${rol} no autorizado para ${rutaBase}`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('❌ Error parseando auth-storage:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/mesero/:path*', '/cocina/:path*'],
};