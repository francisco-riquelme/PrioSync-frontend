import { useState, useCallback } from 'react';

/**
 * Hook para manejar el refresh de progreso en toda la aplicación
 * Permite disparar actualizaciones cuando se completa una lección
 */
export const useProgresoRefresh = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return {
    refreshKey,
    triggerRefresh,
  };
};
