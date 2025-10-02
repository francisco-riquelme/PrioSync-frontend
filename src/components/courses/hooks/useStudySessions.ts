"use client";

import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";

// Import SesionEstudio type from MainTypes
type SesionEstudio = MainTypes["SesionEstudio"]["type"];

// Type for creating a new session (without id and timestamps)
export type CreateSesionEstudioInput = MainTypes["SesionEstudio"]["createType"];

// Type for updating a session (partial fields except id)
export type UpdateSesionEstudioInput = Partial<
  Omit<SesionEstudio, "id" | "createdAt" | "updatedAt">
> & {
  id: string;
};

export interface UseStudySessionsReturn {
  sessions: SesionEstudio[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSession: (
    data: CreateSesionEstudioInput
  ) => Promise<SesionEstudio | null>;
  updateSession: (
    data: UpdateSesionEstudioInput
  ) => Promise<SesionEstudio | null>;
  deleteSession: (id: string) => Promise<boolean>;
  getSession: (id: string) => Promise<SesionEstudio | null>;
}

export const useStudySessions = (
  cursoId?: string | number,
  usuarioId?: string
): UseStudySessionsReturn => {
  const [sessions, setSessions] = useState<SesionEstudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load study sessions (READ)
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
      const filter: Record<string, unknown> = {};

      if (cursoId) {
        filter["cursoId"] = { eq: cursoId.toString() };
      }

      if (usuarioId) {
        filter["usuarioId"] = { eq: usuarioId };
      }

      // Get study sessions
      const sessionsRes = await SesionEstudio.list({
        filter:
          Object.keys(filter).length > 0
            ? (filter as unknown as Record<string, unknown>)
            : undefined,
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

  // Create a new study session (CREATE)
  const createSession = useCallback(
    async (data: CreateSesionEstudioInput): Promise<SesionEstudio | null> => {
      try {
        setError(null);

        const { SesionEstudio } = await getQueryFactories<
          MainTypes,
          "SesionEstudio"
        >({
          entities: ["SesionEstudio"],
        });

        const newSession = await SesionEstudio.create({ input: data });

        // Refresh the list after creation
        await loadSessions();

        return newSession;
      } catch (err) {
        console.error("Error creating study session:", err);
        setError(
          "Error al crear la sesión de estudio. Por favor, intenta nuevamente."
        );
        return null;
      }
    },
    [loadSessions]
  );

  // Update an existing study session (UPDATE)
  const updateSession = useCallback(
    async (data: UpdateSesionEstudioInput): Promise<SesionEstudio | null> => {
      try {
        setError(null);

        const { SesionEstudio } = await getQueryFactories<
          MainTypes,
          "SesionEstudio"
        >({
          entities: ["SesionEstudio"],
        });

        const { id, ...updateData } = data;
        const updatedSession = await SesionEstudio.update({
          input: {
            sesionEstudioId: id,
            ...updateData,
          },
        });

        // Refresh the list after update
        await loadSessions();

        return updatedSession;
      } catch (err) {
        console.error("Error updating study session:", err);
        setError(
          "Error al actualizar la sesión de estudio. Por favor, intenta nuevamente."
        );
        return null;
      }
    },
    [loadSessions]
  );

  // Delete a study session (DELETE)
  const deleteSession = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);

        const { SesionEstudio } = await getQueryFactories<
          MainTypes,
          "SesionEstudio"
        >({
          entities: ["SesionEstudio"],
        });

        await SesionEstudio.delete({ input: { sesionEstudioId: id } });

        // Refresh the list after deletion
        await loadSessions();

        return true;
      } catch (err) {
        console.error("Error deleting study session:", err);
        setError(
          "Error al eliminar la sesión de estudio. Por favor, intenta nuevamente."
        );
        return false;
      }
    },
    [loadSessions]
  );

  // Get a single study session by ID (READ single)
  const getSession = useCallback(
    async (id: string): Promise<SesionEstudio | null> => {
      try {
        setError(null);

        const { SesionEstudio } = await getQueryFactories<
          MainTypes,
          "SesionEstudio"
        >({
          entities: ["SesionEstudio"],
        });

        const session = await SesionEstudio.get({
          input: { sesionEstudioId: id },
        });
        return session;
      } catch (err) {
        console.error("Error fetching study session:", err);
        setError(
          "Error al obtener la sesión de estudio. Por favor, intenta nuevamente."
        );
        return null;
      }
    },
    []
  );

  // Load sessions when parameters change
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    loading,
    error,
    refetch: loadSessions,
    createSession,
    updateSession,
    deleteSession,
    getSession,
  };
};
