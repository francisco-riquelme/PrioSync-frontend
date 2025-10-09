import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";

// Import types from MainTypes
type Usuario = MainTypes["Usuario"]["type"];
// type CursoCompartido = MainTypes["CursoCompartido"]["type"];
// type SesionEstudio = MainTypes["SesionEstudio"]["type"];
// type Curso = MainTypes["Curso"]["type"];

// Define selection sets as const arrays
const usuarioWithRelationsSelectionSet = [
  "usuarioId",
  "email",
  "nombre",
  "apellido",
  "ultimo_login",
  "isValid",
  "createdAt",
  "Cursos.cursoId",
  "Cursos.titulo",
  "Cursos.descripcion",
  "Cursos.imagen_portada",
  "Cursos.duracion_estimada",
  "Cursos.nivel_dificultad",
  "Cursos.estado",
  "Cursos.progreso_estimado",
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
  "CursoCompartido.estado",
  "CursoCompartido.cursoId",
  "CursoCompartido.Curso.cursoId",
  "CursoCompartido.Curso.titulo",
  "CursoCompartido.Curso.descripcion",
  "CursoCompartido.Curso.imagen_portada",
  "CursoCompartido.Curso.duracion_estimada",
  "CursoCompartido.Curso.nivel_dificultad",
  "CursoCompartido.Curso.estado",
  "CursoCompartido.Curso.progreso_estimado",
] as const;

const basicUsuarioSelectionSet = [
  "usuarioId",
  "email",
  "nombre",
  "apellido",
  "ultimo_login",
  "isValid",
  "createdAt",
] as const;

// Use SelectionSet to infer proper types
type UsuarioWithRelations = SelectionSet<
  Usuario,
  typeof usuarioWithRelationsSelectionSet
>;
type BasicUsuario = SelectionSet<Usuario, typeof basicUsuarioSelectionSet>;

// Extract nested types for easier access
type CursoFromUsuario = NonNullable<UsuarioWithRelations["Cursos"]>[0];
type SesionFromUsuario = NonNullable<
  UsuarioWithRelations["SesionesDeEstudio"]
>[0];
type CursoCompartidoFromUsuario = NonNullable<
  UsuarioWithRelations["CursoCompartido"]
>[0];

// Unified interface for both single and multiple usuario scenarios
export interface UseUsuarioReturn {
  // Single usuario scenario
  usuario: Usuario | null;
  cursos: CursoFromUsuario[];
  sesionesEstudio: SesionFromUsuario[];
  cursosCompartidos: CursoCompartidoFromUsuario[];
  // Multiple usuarios scenario
  usuarios: BasicUsuario[];
  // Common properties
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseUsuarioParams {
  usuarioId?: string;
  includeRelations?: boolean;
}

/**
 * Unified hook for fetching usuarios
 * - If usuarioId is provided: fetches single usuario with their courses, study sessions, and shared courses
 * - If usuarioId is not provided: fetches all valid usuarios
 */
export const useUsuario = (
  params?: UseUsuarioParams | string
): UseUsuarioReturn => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<BasicUsuario[]>([]);
  const [cursos, setCursos] = useState<CursoFromUsuario[]>([]);
  const [sesionesEstudio, setSesionesEstudio] = useState<SesionFromUsuario[]>(
    []
  );
  const [cursosCompartidos, setCursosCompartidos] = useState<
    CursoCompartidoFromUsuario[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize params to object format
  const normalizedParams: UseUsuarioParams = (() => {
    if (!params) {
      return {};
    }

    if (typeof params === "object") {
      return params;
    }

    if (typeof params === "string") {
      return { usuarioId: params };
    }

    return {};
  })();

  const { usuarioId, includeRelations = true } = normalizedParams;

  // Unified load function that handles both scenarios
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (usuarioId) {
        // Single usuario scenario
        const { Usuario } = await getQueryFactories<MainTypes, "Usuario">({
          entities: ["Usuario"],
        });

        // Build selection set based on what we want to include
        const selectionSet = includeRelations
          ? usuarioWithRelationsSelectionSet
          : basicUsuarioSelectionSet;

        // Get single usuario by ID
        const usuarioRes = (await Usuario.get({
          input: {
            usuarioId: usuarioId,
          },
          selectionSet,
        })) as unknown as UsuarioWithRelations;

        if (usuarioRes) {
          setUsuario(usuarioRes as unknown as Usuario);

          // Extract related data if included
          if (includeRelations) {
            // Extract courses
            const allCursos: CursoFromUsuario[] = [];
            if (usuarioRes.Cursos) {
              for (const curso of usuarioRes.Cursos) {
                allCursos.push(curso as unknown as CursoFromUsuario);
              }
            }
            setCursos(allCursos);

            // Extract study sessions
            const allSesiones: SesionFromUsuario[] = [];
            if (usuarioRes.SesionesDeEstudio) {
              for (const sesion of usuarioRes.SesionesDeEstudio) {
                allSesiones.push(sesion as unknown as SesionFromUsuario);
              }
            }
            // Sort sessions by date and time
            const sortedSesiones = allSesiones.sort((a, b) => {
              const dateA = new Date(`${a.fecha}T${a.hora_inicio}`);
              const dateB = new Date(`${b.fecha}T${b.hora_inicio}`);
              return dateA.getTime() - dateB.getTime();
            });
            setSesionesEstudio(sortedSesiones);

            // Extract shared courses
            const allCursosCompartidos: CursoCompartidoFromUsuario[] = [];
            if (usuarioRes.CursoCompartido) {
              for (const cursoCompartido of usuarioRes.CursoCompartido) {
                allCursosCompartidos.push(
                  cursoCompartido as unknown as CursoCompartidoFromUsuario
                );
              }
            }
            setCursosCompartidos(allCursosCompartidos);
          }
        } else {
          setError("Usuario no encontrado.");
        }
      } else {
        // Multiple usuarios scenario
        const { Usuario } = await getQueryFactories<MainTypes, "Usuario">({
          entities: ["Usuario"],
        });

        // Filter for valid usuarios only
        const filter = { isValid: { eq: true } };

        const res = await Usuario.list({
          filter,
          followNextToken: true,
          maxPages: 10,
          selectionSet: basicUsuarioSelectionSet,
        });

        setUsuarios((res.items as unknown as BasicUsuario[]) || []);
      }
    } catch (err) {
      console.error("Error loading usuario(s):", err);
      setError(
        usuarioId
          ? "Error al cargar el usuario. Por favor, intenta nuevamente."
          : "Error al cargar los usuarios. Por favor, intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }, [usuarioId, includeRelations]);

  // Load data when usuarioId changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    usuario,
    usuarios,
    cursos,
    sesionesEstudio,
    cursosCompartidos,
    loading,
    error,
    refetch: loadData,
  };
};

// Export Usuario type for convenience
export type { Usuario, UsuarioWithRelations, BasicUsuario };
