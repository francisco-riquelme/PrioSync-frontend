import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import {
  convertStudyBlocksToDaySchedule,
  type StudyBlock,
  type DiaSemana,
} from "@/utils/services/studyBlocks";
import { DaySchedule } from "@/components/modals/welcome/types";

type SesionEstudio = MainTypes["SesionEstudio"]["type"];
type CreateSesionEstudioInput = MainTypes["SesionEstudio"]["createType"];

// Define selection set for Usuario with SesionesDeEstudio and BloqueEstudio relationships
const usuarioWithCalendarDataSelectionSet = [
  "usuarioId",
  "email",
  "nombre",
  "apellido",
  "SesionesDeEstudio.sesionEstudioId",
  "SesionesDeEstudio.fecha",
  "SesionesDeEstudio.hora_inicio",
  "SesionesDeEstudio.hora_fin",
  "SesionesDeEstudio.duracion_minutos",
  "SesionesDeEstudio.tipo",
  "SesionesDeEstudio.estado",
  "SesionesDeEstudio.google_event_id",
  "SesionesDeEstudio.recordatorios",
  "SesionesDeEstudio.usuarioId",
  "SesionesDeEstudio.cursoId",
  "SesionesDeEstudio.leccionId",
  "SesionesDeEstudio.createdAt",
  "SesionesDeEstudio.updatedAt",
  "BloqueEstudio.bloqueEstudioId",
  "BloqueEstudio.dia_semana",
  "BloqueEstudio.hora_inicio",
  "BloqueEstudio.hora_fin",
  "BloqueEstudio.duracion_minutos",
  "BloqueEstudio.usuarioId",
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
  readonly usuarioId: string;
  readonly cursoId: string | null;
  readonly leccionId: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
};

type UsuarioBloqueEstudioLite = {
  readonly bloqueEstudioId: string;
  readonly dia_semana: string;
  readonly hora_inicio: string;
  readonly hora_fin: string;
  readonly duracion_minutos: number | null;
  readonly usuarioId: string;
};

type UsuarioWithCalendarData = {
  readonly usuarioId: string;
  readonly email: string;
  readonly nombre: string | null;
  readonly apellido: string | null;
  readonly SesionesDeEstudio: readonly UsuarioSesionEstudioLite[] | null;
  readonly BloqueEstudio: readonly UsuarioBloqueEstudioLite[] | null;
};

export interface UseCalendarDataReturn {
  sessions: SesionEstudio[];
  studyBlockPreferences: DaySchedule[];
  loading: boolean;
  error: string | null;
  createSession: (
    data: CreateSesionEstudioInput
  ) => Promise<SesionEstudio | null>;
  updateSession: (
    data: { sesionEstudioId: string } & Partial<SesionEstudio>
  ) => Promise<SesionEstudio | null>;
  deleteSession: (id: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

export const useCalendarData = (usuarioId?: string): UseCalendarDataReturn => {
  const [sessions, setSessions] = useState<SesionEstudio[]>([]);
  const [studyBlockPreferences, setStudyBlockPreferences] = useState<
    DaySchedule[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCalendarData = useCallback(async () => {
    if (!usuarioId) {
      setSessions([]);
      setStudyBlockPreferences([]);
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

      const userRes = (await Usuario.get({
        input: { usuarioId },
        selectionSet: usuarioWithCalendarDataSelectionSet,
      })) as unknown as UsuarioWithCalendarData;

      // Extract and sort sessions
      const userSessions = (
        [...(userRes?.SesionesDeEstudio || [])] as UsuarioSesionEstudioLite[]
      ).sort((a: UsuarioSesionEstudioLite, b: UsuarioSesionEstudioLite) => {
        const dateA = new Date(`${a.fecha}T${a.hora_inicio}`);
        const dateB = new Date(`${b.fecha}T${b.hora_inicio}`);
        return dateA.getTime() - dateB.getTime();
      });

      setSessions(userSessions as unknown as SesionEstudio[]);

      // Convert study blocks to day schedules
      const blocks: StudyBlock[] = (userRes?.BloqueEstudio || []).map(
        (block) => ({
          bloqueEstudioId: block.bloqueEstudioId,
          dia_semana: block.dia_semana as DiaSemana,
          hora_inicio: block.hora_inicio,
          hora_fin: block.hora_fin,
          duracion_minutos: block.duracion_minutos || undefined,
          usuarioId: block.usuarioId,
        })
      );

      const schedules = convertStudyBlocksToDaySchedule(blocks);
      setStudyBlockPreferences(schedules);
    } catch (err) {
      console.error("Error loading calendar data:", err);
      setError("Error al cargar datos del calendario");
      setSessions([]);
      setStudyBlockPreferences([]);
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  const createSession = useCallback(
    async (
      data: MainTypes["SesionEstudio"]["createType"]
    ): Promise<SesionEstudio | null> => {
      try {
        const { SesionEstudio } = await getQueryFactories<
          Pick<MainTypes, "SesionEstudio">,
          "SesionEstudio"
        >({
          entities: ["SesionEstudio"],
        });

        const sessionData = {
          ...data,
          sesionEstudioId: crypto.randomUUID(),
        };

        const newSession = await SesionEstudio.create({ input: sessionData });
        await loadCalendarData();
        return newSession;
      } catch (err) {
        console.error("Error creating session:", err);
        setError("Error al crear la sesión");
        return null;
      }
    },
    [loadCalendarData]
  );

  const updateSession = useCallback(
    async (
      data: { sesionEstudioId: string } & Partial<SesionEstudio>
    ): Promise<SesionEstudio | null> => {
      try {
        const { SesionEstudio } = await getQueryFactories<
          Pick<MainTypes, "SesionEstudio">,
          "SesionEstudio"
        >({
          entities: ["SesionEstudio"],
        });

        const { sesionEstudioId, ...updateData } = data;
        const updatedSession = await SesionEstudio.update({
          input: { sesionEstudioId, ...updateData },
        });
        await loadCalendarData();
        return updatedSession;
      } catch (err) {
        console.error("Error updating session:", err);
        setError("Error al actualizar la sesión");
        return null;
      }
    },
    [loadCalendarData]
  );

  const deleteSession = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { SesionEstudio } = await getQueryFactories<
          Pick<MainTypes, "SesionEstudio">,
          "SesionEstudio"
        >({
          entities: ["SesionEstudio"],
        });

        await SesionEstudio.delete({ input: { sesionEstudioId: id } });
        await loadCalendarData();
        return true;
      } catch (err) {
        console.error("Error deleting session:", err);
        setError("Error al eliminar la sesión");
        return false;
      }
    },
    [loadCalendarData]
  );

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  return {
    sessions,
    studyBlockPreferences,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    refreshData: loadCalendarData,
  };
};
