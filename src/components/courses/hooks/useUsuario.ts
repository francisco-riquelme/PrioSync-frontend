import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";

type Usuario = MainTypes["Usuario"]["type"];
type InscripcionCurso = MainTypes["InscripcionCurso"]["type"];
type SesionEstudio = MainTypes["SesionEstudio"]["type"];

// Unified interface for both single and multiple usuario scenarios
export interface UseUsuarioReturn {
  // Single usuario scenario
  usuario: Usuario | null;
  inscripciones: InscripcionCurso[];
  sesionesEstudio: SesionEstudio[];
  // Multiple usuarios scenario
  usuarios: Usuario[];
  // Common properties
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Unified hook for fetching usuarios
 * - If usuarioId is provided: fetches single usuario and their inscriptions and study sessions
 * - If usuarioId is not provided: fetches all valid usuarios
 */
export const useUsuario = (usuarioId?: string): UseUsuarioReturn => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [inscripciones, setInscripciones] = useState<InscripcionCurso[]>([]);
  const [sesionesEstudio, setSesionesEstudio] = useState<SesionEstudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unified load function that handles both scenarios
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (usuarioId) {
        // Single usuario scenario
        const { Usuario, InscripcionCurso, SesionEstudio } =
          await getQueryFactories<
            MainTypes,
            "Usuario" | "InscripcionCurso" | "SesionEstudio"
          >({
            entities: ["Usuario", "InscripcionCurso", "SesionEstudio"],
          });

        // Get single usuario by ID
        const usuarioRes = await Usuario.get({
          input: {
            usuarioId: usuarioId,
          },
        });

        // Get inscripciones for this usuario
        const inscripcionesRes = await InscripcionCurso.list({
          filter: {
            usuarioId: { eq: usuarioId },
          },
          followNextToken: true,
          maxPages: 10,
        });

        // Get study sessions for this usuario
        const sesionesRes = await SesionEstudio.list({
          filter: {
            usuarioId: { eq: usuarioId },
          },
          followNextToken: true,
          maxPages: 10,
        });

        if (usuarioRes) {
          setUsuario(usuarioRes);
          setInscripciones(inscripcionesRes.items || []);
          setSesionesEstudio(sesionesRes.items || []);
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
        });

        setUsuarios(res.items || []);
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
  }, [usuarioId]);

  // Load data when usuarioId changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    usuario,
    usuarios,
    inscripciones,
    sesionesEstudio,
    loading,
    error,
    refetch: loadData,
  };
};

// Export Usuario type for convenience
export type { Usuario };
