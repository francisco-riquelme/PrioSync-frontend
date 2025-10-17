"use client";

import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import type { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";

type SesionEstudio = MainTypes["SesionEstudio"]["type"];
type Usuario = MainTypes["Usuario"]["type"];

// Define the selection set for user with study sessions
const usuarioWithSessionsSelectionSet = [
  "usuarioId",
  "SesionesDeEstudio.sesionEstudioId",
  "SesionesDeEstudio.fecha",
  "SesionesDeEstudio.hora_inicio",
  "SesionesDeEstudio.hora_fin",
  "SesionesDeEstudio.duracion_minutos",
  "SesionesDeEstudio.tipo",
  "SesionesDeEstudio.estado",
  "SesionesDeEstudio.google_event_id",
  "SesionesDeEstudio.recordatorios",
  "SesionesDeEstudio.cursoId",
  "SesionesDeEstudio.leccionId",
  "SesionesDeEstudio.createdAt",
  "SesionesDeEstudio.updatedAt",
] as const;

type UsuarioWithSessions = SelectionSet<
  Usuario,
  typeof usuarioWithSessionsSelectionSet
>;

interface UseCourseStudySessionsParams {
  cursoId: string;
  usuarioId?: string;
}

interface UseCourseStudySessionsReturn {
  sessions: SesionEstudio[];
  loading: boolean;
  error: string | null;
  refreshSessions: () => Promise<void>;
}

export const useCourseStudySessions = ({
  cursoId,
  usuarioId,
}: UseCourseStudySessionsParams): UseCourseStudySessionsReturn => {
  const [sessions, setSessions] = useState<SesionEstudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!cursoId || !usuarioId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { Usuario } = await getQueryFactories<
        Pick<MainTypes, "Usuario">,
        "Usuario"
      >({
        entities: ["Usuario"],
      });

      // Get user with their study sessions
      const userRes = (await Usuario.get({
        input: { usuarioId },
        selectionSet: usuarioWithSessionsSelectionSet,
      })) as unknown as UsuarioWithSessions;

      // Extract and filter sessions for this specific course, then sort by date/time
      const allSessions = (userRes?.SesionesDeEstudio || []).filter(
        (session) => session.cursoId === cursoId
      );

      const courseSessions = allSessions.sort((a, b) => {
        const dateA = new Date(`${a.fecha}T${a.hora_inicio}`);
        const dateB = new Date(`${b.fecha}T${b.hora_inicio}`);
        return dateA.getTime() - dateB.getTime();
      });

      setSessions(courseSessions as unknown as SesionEstudio[]);
    } catch (err) {
      console.error("Error loading course study sessions:", err);
      setError("Error al cargar las sesiones de estudio del curso");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [cursoId, usuarioId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    loading,
    error,
    refreshSessions: loadSessions,
  };
};
