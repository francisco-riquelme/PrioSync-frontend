/**
 * Hook para gestionar las preferencias de horarios del usuario
 * Por ahora lee de localStorage, en el futuro leerá del backend (Usuario.horarios_disponibles)
 */

import { useState, useEffect } from "react";
import { DaySchedule } from "@/components/modals/welcome/types";

interface UseUserPreferencesReturn {
  preferences: DaySchedule[];
  areaEstudio: string;
  canalYoutube: string;
  loading: boolean;
  error: string | null;
  refreshPreferences: () => void;
}

/**
 * Hook para obtener y gestionar las preferencias de horarios del usuario
 */
export const useUserPreferences = (
  userId?: string
): UseUserPreferencesReturn => {
  const [preferences, setPreferences] = useState<DaySchedule[]>([]);
  const [areaEstudio, setAreaEstudio] = useState<string>("");
  const [canalYoutube, setCanalYoutube] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = () => {
    try {
      setLoading(true);
      setError(null);

      // Por ahora: leer de localStorage (datos del welcome modal)
      const savedWelcomeData = localStorage.getItem("welcomeFormData");

      if (savedWelcomeData) {
        const welcomeData = JSON.parse(savedWelcomeData);

        setPreferences(welcomeData.tiempoDisponible || []);
        setAreaEstudio(welcomeData.estudio || "");
        setCanalYoutube(welcomeData.youtubeUrl || "");
      } else {
        // Si no hay datos guardados, dejar vacío
        setPreferences([]);
        setAreaEstudio("");
        setCanalYoutube("");
      }

      // TODO: En el futuro, implementar fetch desde backend
      // if (userId) {
      //   const userPrefs = await fetchUserPreferences(userId);
      //   setPreferences(userPrefs.horarios_disponibles || []);
      //   setAreaEstudio(userPrefs.area_estudio || '');
      //   setCanalYoutube(userPrefs.canal_youtube_favorito || '');
      // }
    } catch (err) {
      console.error("Error al cargar preferencias:", err);
      setError("Error al cargar preferencias de usuario");
      setPreferences([]);
      setAreaEstudio("");
      setCanalYoutube("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  return {
    preferences,
    areaEstudio,
    canalYoutube,
    loading,
    error,
    refreshPreferences: loadPreferences,
  };
};

/**
 * Hook simplificado para solo obtener los horarios disponibles
 */
export const useSchedulePreferences = (
  userId?: string
): {
  schedules: DaySchedule[];
  loading: boolean;
  error: string | null;
} => {
  const { preferences, loading, error } = useUserPreferences(userId);

  return {
    schedules: preferences,
    loading,
    error,
  };
};
