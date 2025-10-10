import { useState, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";
import { ProgresoCuestionario } from "@/types/quiz";

// Define selection sets as const arrays
const progresoCuestionarioWithRelationsSelectionSet = [
  "progresoCuestionarioId",
  "estado",
  "puntaje_obtenido",
  "aprobado",
  "fecha_completado",
  "intento_numero",
  "ultima_pregunta_respondida",
  "recomendaciones",
  "usuarioId",
  "cuestionarioId",
  "Usuario.usuarioId",
  "Usuario.email",
  "Usuario.nombre",
  "Usuario.apellido",
  "Cuestionario.cuestionarioId",
  "Cuestionario.titulo",
  "Cuestionario.descripcion",
  "Cuestionario.tipo",
  "Cuestionario.puntos_maximos",
  "Cuestionario.duracion_minutos",
  "Cuestionario.intentos_permitidos",
  "Cuestionario.preguntas_aleatorias",
  "Cuestionario.porcentaje_aprobacion",
] as const;

// Use SelectionSet to infer proper types
type ProgresoCuestionarioWithRelations = SelectionSet<
  ProgresoCuestionario,
  typeof progresoCuestionarioWithRelationsSelectionSet
>;

// Extract nested types for easier access
// type UsuarioFromProgreso = NonNullable<
//   ProgresoCuestionarioWithRelations["Usuario"]
// >;
type CuestionarioFromProgreso = NonNullable<
  ProgresoCuestionarioWithRelations["Cuestionario"]
>;

// Quiz attempt with extended info
export interface QuizAttempt extends ProgresoCuestionario {
  cuestionarioTitulo?: string;
  totalPreguntas?: number;
}

export interface UseQuizAttemptsReturn {
  // Quiz attempts
  attempts: QuizAttempt[];
  currentAttemptNumber: number;
  currentProgresoCuestionarioId: string | null;

  // State
  loading: boolean;
  error: string | null;

  // Actions
  fetchAttempts: (
    cuestionarioId: string,
    usuarioId: string
  ) => Promise<QuizAttempt[]>;
  startQuizAttempt: (
    cuestionarioId: string,
    usuarioId: string
  ) => Promise<string>;
  continueAttempt: (progresoCuestionarioId: string) => void;
  clearCurrentAttempt: () => void;
  refreshAttempts: (cuestionarioId: string, usuarioId: string) => Promise<void>;
  resetAttempts: () => void;
}

/**
 * Hook for managing quiz attempts
 */
export const useQuizAttempts = (): UseQuizAttemptsReturn => {
  // State management
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [currentAttemptNumber, setCurrentAttemptNumber] = useState(1);
  const [currentProgresoCuestionarioId, setCurrentProgresoCuestionarioId] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all quiz attempts for a user
   */
  const fetchAttempts = useCallback(
    async (quizId: string, usuarioId: string): Promise<QuizAttempt[]> => {
      try {
        setLoading(true);
        setError(null);

        const { ProgresoCuestionario } = await getQueryFactories<
          Pick<MainTypes, "ProgresoCuestionario">,
          "ProgresoCuestionario"
        >({
          entities: ["ProgresoCuestionario"],
        });

        // Use the secondary index to query all attempts for this user/quiz with relations
        const attemptsRes = await ProgresoCuestionario.list({
          filter: {
            usuarioId: { eq: usuarioId },
            cuestionarioId: { eq: quizId },
          },
          followNextToken: true,
          maxPages: 10,
          selectionSet: progresoCuestionarioWithRelationsSelectionSet,
        });

        // Sort by attempt number
        const sortedAttempts = (attemptsRes.items || []).sort(
          (a, b) => (a.intento_numero || 0) - (b.intento_numero || 0)
        );

        // Extract quiz title from the loaded data
        let quizTitle = "";
        if (sortedAttempts.length > 0) {
          const firstAttempt =
            sortedAttempts[0] as unknown as ProgresoCuestionarioWithRelations;
          if (firstAttempt.Cuestionario) {
            const cuestionarioFromProgreso =
              firstAttempt.Cuestionario as unknown as CuestionarioFromProgreso;
            quizTitle = cuestionarioFromProgreso.titulo || "";
          }
        }

        // Enrich attempts with additional info
        const enrichedAttempts: QuizAttempt[] = sortedAttempts.map(
          (attempt) => ({
            ...attempt,
            cuestionarioTitulo: quizTitle,
          })
        );

        setAttempts(enrichedAttempts);

        // Calculate next attempt number
        const maxAttempt = Math.max(
          0,
          ...sortedAttempts.map((a) => a.intento_numero || 0)
        );
        setCurrentAttemptNumber(maxAttempt + 1);

        return enrichedAttempts;
      } catch (err) {
        console.error("Error fetching quiz attempts:", err);
        setError("Error al cargar los intentos del cuestionario.");
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Start a new quiz attempt - creates ProgresoCuestionario record
   */
  const startQuizAttempt = useCallback(
    async (cuestionarioId: string, usuarioId: string): Promise<string> => {
      try {
        const { ProgresoCuestionario } = await getQueryFactories<
          Pick<MainTypes, "ProgresoCuestionario">,
          "ProgresoCuestionario"
        >({
          entities: ["ProgresoCuestionario"],
        });

        const progresoCuestionarioId = crypto.randomUUID();

        // Create the attempt record with "en_proceso" status
        await ProgresoCuestionario.create({
          input: {
            progresoCuestionarioId,
            usuarioId,
            cuestionarioId,
            puntaje_obtenido: 0,
            estado: "en_proceso",
            fecha_completado: new Date().toISOString(),
            intento_numero: currentAttemptNumber,
          },
        });

        setCurrentProgresoCuestionarioId(progresoCuestionarioId);
        return progresoCuestionarioId;
      } catch (err) {
        console.error("Error starting quiz attempt:", err);
        throw new Error("Error al iniciar el intento del cuestionario");
      }
    },
    [currentAttemptNumber]
  );

  /**
   * Continue from a previous attempt
   */
  const continueAttempt = useCallback((progresoCuestionarioId: string) => {
    setCurrentProgresoCuestionarioId(progresoCuestionarioId);
  }, []);

  /**
   * Clear the current attempt ID (for retry/reset)
   */
  const clearCurrentAttempt = useCallback(() => {
    setCurrentProgresoCuestionarioId(null);
  }, []);

  /**
   * Refresh attempts for the current quiz
   */
  const refreshAttempts = useCallback(
    async (cuestionarioId: string, usuarioId: string) => {
      try {
        const { ProgresoCuestionario } = await getQueryFactories<
          Pick<MainTypes, "ProgresoCuestionario">,
          "ProgresoCuestionario"
        >({
          entities: ["ProgresoCuestionario"],
        });

        const attemptsRes = await ProgresoCuestionario.list({
          filter: {
            usuarioId: { eq: usuarioId },
            cuestionarioId: { eq: cuestionarioId },
          },
          followNextToken: true,
          maxPages: 10,
          selectionSet: progresoCuestionarioWithRelationsSelectionSet,
        });

        const sortedAttempts = (attemptsRes.items || []).sort(
          (a, b) => (a.intento_numero || 0) - (b.intento_numero || 0)
        );

        // Extract quiz title from the loaded data
        let quizTitle = "";
        if (sortedAttempts.length > 0) {
          const firstAttempt =
            sortedAttempts[0] as unknown as ProgresoCuestionarioWithRelations;
          if (firstAttempt.Cuestionario) {
            const cuestionarioFromProgreso =
              firstAttempt.Cuestionario as unknown as CuestionarioFromProgreso;
            quizTitle = cuestionarioFromProgreso.titulo || "";
          }
        }

        const enrichedAttempts: QuizAttempt[] = sortedAttempts.map(
          (attempt) => ({
            ...attempt,
            cuestionarioTitulo: quizTitle,
          })
        );

        setAttempts(enrichedAttempts);

        const maxAttempt = Math.max(
          0,
          ...sortedAttempts.map((a) => a.intento_numero || 0)
        );
        setCurrentAttemptNumber(maxAttempt + 1);
      } catch (err) {
        console.warn("Could not refresh attempts:", err);
      }
    },
    []
  );

  /**
   * Reset attempts state
   */
  const resetAttempts = useCallback(() => {
    setAttempts([]);
    setCurrentAttemptNumber(1);
    setCurrentProgresoCuestionarioId(null);
    setError(null);
  }, []);

  return {
    // Data
    attempts,
    currentAttemptNumber,
    currentProgresoCuestionarioId,

    // State
    loading,
    error,

    // Actions
    fetchAttempts,
    startQuizAttempt,
    continueAttempt,
    clearCurrentAttempt,
    refreshAttempts,
    resetAttempts,
  };
};
