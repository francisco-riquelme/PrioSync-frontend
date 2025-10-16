/**
 * Hook para gestionar las preferencias de horarios del usuario
 * Lee desde el backend (BloqueEstudio) y mantiene localStorage como fallback
 */

import { useState, useEffect } from "react";
import { DaySchedule } from "@/components/modals/welcome/types";
import { studyBlocksService } from "@/utils/services/studyBlocks";

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
 * Prioriza datos del backend, usa localStorage como fallback
 */
export const useUserPreferences = (
  userId?: string
): UseUserPreferencesReturn => {
  const [preferences, setPreferences] = useState<DaySchedule[]>([]);
  const [areaEstudio, setAreaEstudio] = useState<string>("");
  const [canalYoutube, setCanalYoutube] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      // Si hay userId, intentar cargar desde backend primero
      if (userId) {
        try {
          const blocks = await studyBlocksService.getUserStudyBlocks(userId);

          if (blocks && blocks.length > 0) {
            // TODO: Backend no almacena día de la semana aún
            // Por ahora, cargar desde localStorage como fallback
            const savedWelcomeData = localStorage.getItem("welcomeFormData");
            if (savedWelcomeData) {
              const welcomeData = JSON.parse(savedWelcomeData);
              setPreferences(welcomeData.tiempoDisponible || []);
              setAreaEstudio(welcomeData.estudio || "");
              setCanalYoutube(welcomeData.youtubeUrl || "");
            }
          } else {
            // No hay blocks en backend, cargar de localStorage
            loadFromLocalStorage();
          }
        } catch (backendError) {
          console.error(
            "Error loading from backend, falling back to localStorage:",
            backendError
          );
          loadFromLocalStorage();
        }
      } else {
        // No hay userId, cargar solo de localStorage
        loadFromLocalStorage();
      }
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

  const loadFromLocalStorage = () => {
    const savedWelcomeData = localStorage.getItem("welcomeFormData");

    if (savedWelcomeData) {
      const welcomeData = JSON.parse(savedWelcomeData);
      setPreferences(welcomeData.tiempoDisponible || []);
      setAreaEstudio(welcomeData.estudio || "");
      setCanalYoutube(welcomeData.youtubeUrl || "");
    } else {
      setPreferences([]);
      setAreaEstudio("");
      setCanalYoutube("");
    }
  };

  useEffect(() => {
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
