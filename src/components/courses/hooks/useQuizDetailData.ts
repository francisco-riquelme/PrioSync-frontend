import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";

type Cuestionario = MainTypes["Cuestionario"]["type"];
type Pregunta = MainTypes["Pregunta"]["type"];
type OpcionPregunta = MainTypes["OpcionPregunta"]["type"];
type ProgresoCuestionario = MainTypes["ProgresoCuestionario"]["type"];
type Respuesta = MainTypes["Respuesta"]["type"];

// Define selection set for quiz detail with questions and options
const quizDetailSelectionSet = [
  "cuestionarioId",
  "titulo",
  "descripcion",
  "tipo",
  "puntos_maximos",
  "duracion_minutos",
  "intentos_permitidos",
  "preguntas_aleatorias",
  "porcentaje_aprobacion",
  "cursoId",
  "moduloId",
  "materialEstudioId",
  "Preguntas.preguntaId",
  "Preguntas.texto_pregunta",
  "Preguntas.tipo",
  "Preguntas.peso_puntos",
  "Preguntas.orden",
  "Preguntas.explicacion",
  "Preguntas.Opciones.opcionId",
  "Preguntas.Opciones.texto",
  "Preguntas.Opciones.orden",
  "Preguntas.Opciones.imagen",
  "Preguntas.Opciones.audio",
  "Preguntas.Opciones.video",
  "Preguntas.Opciones.archivo",
  "Preguntas.Opciones.es_correcta",
] as const;

// Define selection set for quiz attempts with relations
const quizAttemptsSelectionSet = [
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

// Define selection set for quiz answers
const quizAnswersSelectionSet = [
  "respuestaId",
  "respuesta_texto",
  "es_correcta",
  "fecha_respuesta",
  "usuarioId",
  "preguntaId",
  "opcionId",
  "progresoCuestionarioId",
  "Usuario.usuarioId",
  "Usuario.email",
  "Usuario.nombre",
  "Usuario.apellido",
  "Pregunta.preguntaId",
  "Pregunta.texto_pregunta",
  "Pregunta.tipo",
  "Pregunta.peso_puntos",
  "Pregunta.orden",
  "Pregunta.explicacion",
  "Opcion.opcionId",
  "Opcion.texto",
  "Opcion.orden",
  "Opcion.es_correcta",
] as const;

// Use SelectionSet to infer proper types
type CuestionarioWithQuestions = SelectionSet<
  Cuestionario,
  typeof quizDetailSelectionSet
>;
type ProgresoCuestionarioWithRelations = SelectionSet<
  ProgresoCuestionario,
  typeof quizAttemptsSelectionSet
>;
type RespuestaWithRelations = SelectionSet<
  Respuesta,
  typeof quizAnswersSelectionSet
>;

// Extract nested types for easier access
export type PreguntaFromCuestionario = NonNullable<
  CuestionarioWithQuestions["Preguntas"]
>[0];
export type OpcionFromPregunta = NonNullable<
  PreguntaFromCuestionario["Opciones"]
>[0];

// Quiz attempt with extended info
export interface QuizAttemptWithAnswers
  extends ProgresoCuestionarioWithRelations {
  respuestas?: RespuestaWithRelations[];
}

export interface UseQuizDetailDataParams {
  cuestionarioId: string;
  usuarioId: string;
}

export interface UseQuizDetailDataReturn {
  quiz: CuestionarioWithQuestions | null;
  preguntas: PreguntaFromCuestionario[];
  attempts: QuizAttemptWithAnswers[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching quiz detail data with questions, options, and attempt history
 * Used for quiz detail view where we need full quiz + questions + options + attempts + answers
 * Auto-fetches on mount
 * Includes refetch capability for post-completion refresh
 */
export const useQuizDetailData = (
  params: UseQuizDetailDataParams
): UseQuizDetailDataReturn => {
  const { cuestionarioId, usuarioId } = params;

  const [quiz, setQuiz] = useState<CuestionarioWithQuestions | null>(null);
  const [preguntas, setPreguntas] = useState<PreguntaFromCuestionario[]>([]);
  const [attempts, setAttempts] = useState<QuizAttemptWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuizDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { Cuestionario, ProgresoCuestionario, Respuesta } =
        await getQueryFactories<
          Pick<
            MainTypes,
            "Cuestionario" | "ProgresoCuestionario" | "Respuesta"
          >,
          "Cuestionario" | "ProgresoCuestionario" | "Respuesta"
        >({
          entities: ["Cuestionario", "ProgresoCuestionario", "Respuesta"],
        });

      // Fetch quiz with questions and options
      const quizRes = (await Cuestionario.get({
        input: { cuestionarioId },
        selectionSet: quizDetailSelectionSet,
      })) as unknown as CuestionarioWithQuestions;

      if (!quizRes) {
        throw new Error("Cuestionario no encontrado");
      }

      setQuiz(quizRes);

      // Extract questions
      const allPreguntas: PreguntaFromCuestionario[] = [];
      if (quizRes.Preguntas) {
        for (const pregunta of quizRes.Preguntas) {
          const preguntaWithOpciones =
            pregunta as unknown as PreguntaFromCuestionario;
          allPreguntas.push(preguntaWithOpciones);
        }
      }

      setPreguntas(allPreguntas);

      // Fetch quiz attempts for this user
      const attemptsRes = await ProgresoCuestionario.list({
        filter: {
          usuarioId: { eq: usuarioId },
          cuestionarioId: { eq: cuestionarioId },
        },
        followNextToken: true,
        maxPages: 10,
        selectionSet: quizAttemptsSelectionSet,
      });

      // Fetch answers for each attempt
      const attemptsWithAnswers: QuizAttemptWithAnswers[] = [];
      for (const attempt of attemptsRes.items || []) {
        const attemptWithRelations =
          attempt as unknown as ProgresoCuestionarioWithRelations;

        // Fetch answers for this attempt
        const answersRes = await Respuesta.list({
          filter: {
            progresoCuestionarioId: { eq: attempt.progresoCuestionarioId },
          },
          followNextToken: true,
          maxPages: 10,
          selectionSet: quizAnswersSelectionSet,
        });

        const respuestas = (answersRes.items ||
          []) as unknown as RespuestaWithRelations[];

        attemptsWithAnswers.push({
          ...attemptWithRelations,
          respuestas,
        });
      }

      setAttempts(attemptsWithAnswers);
    } catch (err) {
      console.error("Error loading quiz detail:", err);
      setError(
        "Error al cargar el cuestionario. Por favor, intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }, [cuestionarioId, usuarioId]);

  // Refetch function for post-completion refresh
  const refetch = useCallback(async () => {
    await loadQuizDetail();
  }, [loadQuizDetail]);

  // Load quiz detail when params change
  useEffect(() => {
    loadQuizDetail();
  }, [loadQuizDetail]);

  return {
    quiz,
    preguntas,
    attempts,
    loading,
    error,
    refetch,
  };
};

// Export types for convenience
export type {
  Cuestionario,
  Pregunta,
  OpcionPregunta,
  ProgresoCuestionario,
  Respuesta,
};
