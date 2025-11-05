"use client";

import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import type { MainTypes } from "@/utils/api/schema";

type SesionEstudio = MainTypes["SesionEstudio"]["type"];

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

type UsuarioSesionEstudioLite = {
  readonly sesionEstudioId: string;
  readonly fecha: string;
  readonly hora_inicio: string;
  readonly hora_fin: string;
  readonly duracion_minutos: number | null;
  readonly tipo: string | null;
  readonly estado: string | null;
  readonly google_event_id: string | null;
  readonly recordatorios: string[] | null;
  readonly cursoId: string | null;
  readonly leccionId: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
};

type UsuarioWithSessionsLite = {
  readonly usuarioId: string;
  readonly SesionesDeEstudio: readonly UsuarioSesionEstudioLite[] | null;
};

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
      })) as unknown as UsuarioWithSessionsLite;

      // Extract and filter sessions for this specific course, then sort by date/time
      const allSessions = [...(userRes?.SesionesDeEstudio || [])].filter(
        (session) => session.cursoId === cursoId
      );

      const courseSessions = (
        [...allSessions] as UsuarioSesionEstudioLite[]
      ).sort((a: UsuarioSesionEstudioLite, b: UsuarioSesionEstudioLite) => {
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
