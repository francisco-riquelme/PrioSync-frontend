"use client";

import { useState, useEffect, useCallback } from "react";
import {
  StudySession,
  StudySessionFormData,
  StudySessionFilters,
} from "@/types/studySession";
import { StudySessionStorage } from "@/utils/studySessionStorage";

export const useStudySessions = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar sesiones al inicializar
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedSessions = StudySessionStorage.getAll();
      setSessions(loadedSessions);
    } catch (err) {
      setError("Error al cargar las sesiones de estudio");
      console.error("Error loading sessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear nueva sesión
  const createSession = useCallback(
    async (formData: StudySessionFormData): Promise<StudySession | null> => {
      try {
        setError(null);

        // Convertir FormData a StudySession
        const startDateTime = new Date(
          `${formData.startDate}T${formData.startTime}`
        );
        const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

        // Validaciones
        if (startDateTime >= endDateTime) {
          throw new Error(
            "La fecha de fin debe ser posterior a la fecha de inicio"
          );
        }

        if (startDateTime < new Date()) {
          throw new Error("No puedes crear una sesión en el pasado");
        }

        const sessionData: Omit<
          StudySession,
          "id" | "createdAt" | "updatedAt"
        > = {
          title: formData.title.trim(),
          subject: formData.subject,
          startTime: startDateTime,
          endTime: endDateTime,
          description: formData.description?.trim(),
          location: formData.location?.trim(),
          priority: formData.priority,
          status: "planned",
          reminder: formData.reminder,
          tags: formData.tags || [],
        };

        const newSession = StudySessionStorage.add(sessionData);
        setSessions((prev) => [...prev, newSession]);

        return newSession;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al crear la sesión";
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  // Actualizar sesión existente
  const updateSession = useCallback(
    async (
      id: string,
      formData: StudySessionFormData
    ): Promise<StudySession | null> => {
      try {
        setError(null);

        const startDateTime = new Date(
          `${formData.startDate}T${formData.startTime}`
        );
        const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

        // Validaciones
        if (startDateTime >= endDateTime) {
          throw new Error(
            "La fecha de fin debe ser posterior a la fecha de inicio"
          );
        }

        const updates: Partial<StudySession> = {
          title: formData.title.trim(),
          subject: formData.subject,
          startTime: startDateTime,
          endTime: endDateTime,
          description: formData.description?.trim(),
          location: formData.location?.trim(),
          priority: formData.priority,
          reminder: formData.reminder,
          tags: formData.tags || [],
        };

        const updatedSession = StudySessionStorage.update(id, updates);

        if (updatedSession) {
          setSessions((prev) =>
            prev.map((session) =>
              session.id === id ? updatedSession : session
            )
          );
          return updatedSession;
        } else {
          throw new Error("Sesión no encontrada");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al actualizar la sesión";
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  // Eliminar sesión
  const deleteSession = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const success = StudySessionStorage.delete(id);

      if (success) {
        setSessions((prev) => prev.filter((session) => session.id !== id));
        return true;
      } else {
        throw new Error("Sesión no encontrada");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al eliminar la sesión";
      setError(errorMessage);
      return false;
    }
  }, []);

  // Cambiar estado de sesión
  const updateSessionStatus = useCallback(
    async (id: string, status: StudySession["status"]): Promise<boolean> => {
      try {
        setError(null);

        const updatedSession = StudySessionStorage.update(id, { status });

        if (updatedSession) {
          setSessions((prev) =>
            prev.map((session) =>
              session.id === id ? updatedSession : session
            )
          );
          return true;
        } else {
          throw new Error("Sesión no encontrada");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al actualizar el estado";
        setError(errorMessage);
        return false;
      }
    },
    []
  );

  // Obtener sesión por ID
  const getSessionById = useCallback(
    (id: string): StudySession | null => {
      return sessions.find((session) => session.id === id) || null;
    },
    [sessions]
  );

  // Filtrar sesiones
  const getFilteredSessions = useCallback(
    (filters: StudySessionFilters = {}): StudySession[] => {
      return sessions.filter((session) => {
        // Filtro por materia
        if (
          filters.subject &&
          !session.subject.toLowerCase().includes(filters.subject.toLowerCase())
        ) {
          return false;
        }

        // Filtro por prioridad
        if (filters.priority && session.priority !== filters.priority) {
          return false;
        }

        // Filtro por estado
        if (filters.status && session.status !== filters.status) {
          return false;
        }

        // Filtro por rango de fechas
        if (filters.dateRange) {
          const sessionStart = new Date(session.startTime);
          if (
            sessionStart < filters.dateRange.start ||
            sessionStart > filters.dateRange.end
          ) {
            return false;
          }
        }

        return true;
      });
    },
    [sessions]
  );

  // Obtener sesiones de hoy
  const getTodaySessions = useCallback((): StudySession[] => {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    return getFilteredSessions({
      dateRange: { start: startOfDay, end: endOfDay },
    });
  }, [getFilteredSessions]);

  // Obtener próximas sesiones (siguientes 7 días)
  const getUpcomingSessions = useCallback((): StudySession[] => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return getFilteredSessions({
      dateRange: { start: now, end: nextWeek },
    })
      .filter((session) => session.status === "planned")
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 5); // Máximo 5 próximas sesiones
  }, [getFilteredSessions]);

  // Estadísticas básicas
  const getStatistics = useCallback(() => {
    const now = new Date();
    const thisWeek = sessions.filter((session) => {
      const weekStart = new Date(
        now.getTime() - now.getDay() * 24 * 60 * 60 * 1000
      );
      return session.startTime >= weekStart;
    });

    return {
      total: sessions.length,
      planned: sessions.filter((s) => s.status === "planned").length,
      completed: sessions.filter((s) => s.status === "completed").length,
      inProgress: sessions.filter((s) => s.status === "in-progress").length,
      thisWeek: thisWeek.length,
      today: getTodaySessions().length,
    };
  }, [sessions, getTodaySessions]);

  return {
    // Estado
    sessions,
    loading,
    error,

    // Operaciones CRUD
    createSession,
    updateSession,
    deleteSession,
    updateSessionStatus,

    // Consultas
    getSessionById,
    getFilteredSessions,
    getTodaySessions,
    getUpcomingSessions,
    getStatistics,

    // Utilidades
    loadSessions,
    clearError: () => setError(null),
  };
};
