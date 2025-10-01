"use client";

import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";

// Import SesionEstudio type from MainTypes
type SesionEstudio = MainTypes["SesionEstudio"]["type"];

export interface UseStudySessionsReturn {
  sessions: SesionEstudio[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useStudySessions = (
  cursoId?: string | number,
  usuarioId?: string
): UseStudySessionsReturn => {
  const [sessions, setSessions] = useState<SesionEstudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load study sessions
  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the query factories pattern
      const { SesionEstudio } = await getQueryFactories<
        MainTypes,
        "SesionEstudio"
      >({
        entities: ["SesionEstudio"],
      });

      // Build filter based on provided parameters
      const filter: any = {};

      if (cursoId) {
        filter.cursoId = { eq: cursoId.toString() };
      }

      if (usuarioId) {
        filter.usuarioId = { eq: usuarioId };
      }

      // Get study sessions
      const sessionsRes = await SesionEstudio.list({
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        followNextToken: true,
        maxPages: 10,
      });

      // Sort by fecha and hora_inicio
      const sortedSessions = (sessionsRes.items || []).sort((a, b) => {
        const dateA = new Date(`${a.fecha}T${a.hora_inicio}`);
        const dateB = new Date(`${b.fecha}T${b.hora_inicio}`);
        return dateA.getTime() - dateB.getTime();
      });

      setSessions(sortedSessions);
    } catch (err) {
      console.error("Error loading study sessions:", err);
      setError(
        "Error al cargar las sesiones de estudio. Por favor, intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }, [cursoId, usuarioId]);

  // Load sessions when parameters change
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    loading,
    error,
    refetch: loadSessions,
  };
};
