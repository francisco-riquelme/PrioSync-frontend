"use client";

import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";

// Import types from MainTypes
type SesionEstudio = MainTypes["SesionEstudio"]["type"];

// Define selection sets as const arrays
const sessionWithRelationsSelectionSet = [
  "sesionEstudioId",
  "fecha",
  "hora_inicio",
  "hora_fin",
  "duracion_minutos",
  "tipo",
  "estado",
  "google_event_id",
  "recordatorios",
  "usuarioId",
  "cursoId",
  "leccionId",
  "Usuario.usuarioId",
  "Usuario.email",
  "Usuario.nombre",
  "Usuario.apellido",
  "Usuario.ultimo_login",
  "Usuario.isValid",
  "Curso.cursoId",
  "Curso.titulo",
  "Curso.descripcion",
  "Curso.imagen_portada",
  "Curso.duracion_estimada",
  "Curso.nivel_dificultad",
  "Curso.estado",
  "Curso.progreso_estimado",
  "Leccion.leccionId",
  "Leccion.titulo",
  "Leccion.descripcion",
  "Leccion.duracion_minutos",
  "Leccion.tipo",
  "Leccion.url_contenido",
  "Leccion.completada",
  "Leccion.orden",
  "Leccion.moduloId",
] as const;

const basicSessionSelectionSet = [
  "sesionEstudioId",
  "fecha",
  "hora_inicio",
  "hora_fin",
  "duracion_minutos",
  "tipo",
  "estado",
  "google_event_id",
  "recordatorios",
  "usuarioId",
  "cursoId",
  "leccionId",
] as const;

// Use SelectionSet to infer proper types
type SessionWithRelations = SelectionSet<
  SesionEstudio,
  typeof sessionWithRelationsSelectionSet
>;
type BasicSession = SelectionSet<
  SesionEstudio,
  typeof basicSessionSelectionSet
>;

// Extract nested types for easier access
type UsuarioFromSession = NonNullable<SessionWithRelations["Usuario"]>;
type CursoFromSession = NonNullable<SessionWithRelations["Curso"]>;
type LeccionFromSession = NonNullable<SessionWithRelations["Leccion"]>;

// Type for creating a new session (without id and timestamps)
export type CreateSesionEstudioInput = MainTypes["SesionEstudio"]["createType"];

// Type for updating a session (partial fields except id)
export type UpdateSesionEstudioInput = Partial<
  Omit<SesionEstudio, "sesionEstudioId" | "createdAt" | "updatedAt">
> & {
  sesionEstudioId: string;
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

interface UseStudySessionsParams {
  cursoId?: string | number;
  usuarioId?: string;
}

/**
 * Hook for managing study sessions with full CRUD operations
 * Always uses full selectionSet for complete data with relations
 */
export const useStudySessions = (
  params?: UseStudySessionsParams | string | number
): UseStudySessionsReturn => {
  const [sessions, setSessions] = useState<SesionEstudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize params to object format
  const normalizedParams: UseStudySessionsParams = (() => {
    if (!params) {
      return {};
    }

    if (typeof params === "object" && !Array.isArray(params)) {
      return params;
    }

    if (typeof params === "string" || typeof params === "number") {
      return { cursoId: params };
    }

    return {};
  })();

  const { cursoId, usuarioId } = normalizedParams;

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

      // Always use full selectionSet for list operations
      const sessionsRes = await SesionEstudio.list({
        filter:
          Object.keys(filter).length > 0
            ? (filter as unknown as Record<string, unknown>)
            : undefined,
        followNextToken: true,
        maxPages: 10,
        selectionSet: sessionWithRelationsSelectionSet,
      });

      // Sort by fecha and hora_inicio
      const sortedSessions = (sessionsRes.items || []).sort((a, b) => {
        const dateA = new Date(`${a.fecha}T${a.hora_inicio}`);
        const dateB = new Date(`${b.fecha}T${b.hora_inicio}`);
        return dateA.getTime() - dateB.getTime();
      });

      setSessions(sortedSessions as unknown as SesionEstudio[]);
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

        const { sesionEstudioId, ...updateData } = data;
        const updatedSession = await SesionEstudio.update({
          input: {
            sesionEstudioId,
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

        // Always use full selectionSet for single session fetch
        const session = await SesionEstudio.get({
          input: { sesionEstudioId: id },
          selectionSet: sessionWithRelationsSelectionSet,
        });

        return session as unknown as SesionEstudio;
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
