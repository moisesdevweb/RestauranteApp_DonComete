// src/modules/admin/dashboard/useDashboard.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { getDashboardData, DashboardData } from '@/modules/admin/services/dashboard.service';

export const useDashboard = () => {
  const [datos,   setDatos]   = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getDashboardData();
      setDatos(d);
      setLastUpdate(new Date());
      setError(null);
    } catch {
      setError('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 60_000); // refresca cada 60s
    return () => clearInterval(interval);
  }, [cargar]);

  return { datos, loading, error, lastUpdate, refetch: cargar };
};
