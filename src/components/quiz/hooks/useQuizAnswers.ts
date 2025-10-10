import { useState, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";
import { QuizQuestionView, QuizAnalysis, QuizDataView } from "@/types/quiz";

type Cuestionario = MainTypes["Cuestionario"]["type"];

// Define selection sets as const arrays
const respuestaWithRelationsSelectionSet = [
  "respuestaId",
  "respuesta_texto",
  "es_correcta",
  "fecha_respuesta",
  "usuarioId",
  "preguntaId",
  "opcionId",
  "progresoCuestionarioId",
  "Opcion.opcionId",
  "Opcion.texto",
  "Opcion.orden",
  "Opcion.imagen",
  "Opcion.audio",
  "Opcion.video",
  "Opcion.archivo",
  "Opcion.es_correcta",
] as const;

const opcionPreguntaSelectionSet = [
  "opcionId",
  "texto",
  "orden",
  "imagen",
  "audio",
  "video",
  "archivo",
  "es_correcta",
  "preguntaId",
] as const;

// Use SelectionSet to infer proper types
type RespuestaWithRelations = SelectionSet<
  MainTypes["Respuesta"]["type"],
  typeof respuestaWithRelationsSelectionSet
>;
type OpcionPreguntaSelected = SelectionSet<
  MainTypes["OpcionPregunta"]["type"],
  typeof opcionPreguntaSelectionSet
>;

// Extract nested types for easier access
type OpcionFromRespuesta = NonNullable<RespuestaWithRelations["Opcion"]>;

export interface UseQuizAnswersReturn {
  // User answers
  userAnswers: Record<string, string>;

  // State
  submitting: boolean;
  error: string | null;

  // Actions
  submitAnswer: (
    questionId: string,
    opcionId: string,
    answerText?: string,
    cuestionarioId?: string,
    usuarioId?: string,
    currentProgresoCuestionarioId?: string | null,
    questions?: QuizQuestionView[]
  ) => Promise<void>;
  submitQuiz: (
    answers: Record<string, number>,
    quiz: QuizDataView | null,
    cuestionario: Cuestionario | null,
    currentProgresoCuestionarioId?: string | null
  ) => Promise<QuizAnalysis>;
  fetchAttemptAnswers: (
    progresoCuestionarioId: string,
    questions: QuizQuestionView[]
  ) => Promise<Record<string, number>>;
  resetAnswers: () => void;
}

/**
 * Hook for managing quiz answers
 */
export const useQuizAnswers = (): UseQuizAnswersReturn => {
  // State management
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submit a single answer to a question
   * Creates a new answer or updates existing one
   */
  const submitAnswer = useCallback(
    async (
      questionId: string,
      opcionId: string,
      answerText?: string,
      cuestionarioId?: string,
      usuarioId?: string,
      currentProgresoCuestionarioId?: string | null,
      questions?: QuizQuestionView[]
    ) => {
      if (!cuestionarioId || !usuarioId) {
        throw new Error("Missing required parameters");
      }

      // Ensure we have a progresoCuestionarioId
      const progresoCuestionarioId = currentProgresoCuestionarioId;
      if (!progresoCuestionarioId) {
        // This would need to be handled by the parent component
        throw new Error("No active quiz attempt");
      }

      try {
        setSubmitting(true);

        const { Respuesta, OpcionPregunta } = await getQueryFactories<
          MainTypes,
          "Respuesta" | "OpcionPregunta"
        >({
          entities: ["Respuesta", "OpcionPregunta"],
        });

        // Get the selected option to check if it's correct
        let isCorrect = false;
        if (opcionId) {
          const opcion = (await OpcionPregunta.get({
            input: { opcionId },
            selectionSet: opcionPreguntaSelectionSet,
          })) as OpcionPreguntaSelected;
          isCorrect = opcion?.es_correcta || false;
        }

        // Check if an answer already exists for this question in this attempt
        const existingAnswersRes = await Respuesta.list({
          filter: {
            usuarioId: { eq: usuarioId },
            preguntaId: { eq: questionId },
            progresoCuestionarioId: { eq: progresoCuestionarioId },
          },
          followNextToken: true,
          maxPages: 1,
          selectionSet: respuestaWithRelationsSelectionSet,
        });

        const existingAnswer = existingAnswersRes.items?.[0] as unknown as
          | RespuestaWithRelations
          | undefined;

        if (existingAnswer) {
          // Update existing answer
          await Respuesta.update({
            input: {
              respuestaId: existingAnswer.respuestaId,
              opcionId: opcionId || undefined,
              respuesta_texto: answerText || undefined,
              es_correcta: isCorrect,
              fecha_respuesta: new Date().toISOString(),
            },
          });
        } else {
          // Create new answer record
          await Respuesta.create({
            input: {
              respuestaId: crypto.randomUUID(),
              usuarioId,
              preguntaId: questionId,
              opcionId: opcionId || undefined,
              respuesta_texto: answerText || undefined,
              es_correcta: isCorrect,
              fecha_respuesta: new Date().toISOString(),
              progresoCuestionarioId,
            },
          });
        }

        // Update local state
        setUserAnswers((prev) => ({
          ...prev,
          [questionId]: opcionId || answerText || "",
        }));

        // Update ultima_pregunta_respondida in ProgresoCuestionario
        if (questions) {
          const questionIndex = questions.findIndex((q) => q.id === questionId);
          if (questionIndex !== -1) {
            const { ProgresoCuestionario } = await getQueryFactories<
              MainTypes,
              "ProgresoCuestionario"
            >({
              entities: ["ProgresoCuestionario"],
            });

            await ProgresoCuestionario.update({
              input: {
                progresoCuestionarioId,
                ultima_pregunta_respondida: questionIndex,
              },
            });
          }
        }
      } catch (err) {
        console.error("Error submitting answer:", err);
        throw new Error("Error al guardar la respuesta");
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  /**
   * Submit complete quiz and calculate score
   * Updates the existing ProgresoCuestionario record (answers already saved)
   */
  const submitQuiz = useCallback(
    async (
      answers: Record<string, number>,
      quiz: QuizDataView | null,
      cuestionario: Cuestionario | null,
      currentProgresoCuestionarioId?: string | null
    ): Promise<QuizAnalysis> => {
      if (!quiz || !cuestionario) {
        throw new Error("No quiz loaded");
      }

      // Ensure we have a progresoCuestionarioId
      if (!currentProgresoCuestionarioId) {
        throw new Error("No active quiz attempt");
      }

      try {
        setSubmitting(true);

        const { ProgresoCuestionario } = await getQueryFactories<
          MainTypes,
          "ProgresoCuestionario"
        >({
          entities: ["ProgresoCuestionario"],
        });

        // Calculate score (answers are already saved)
        let correctCount = 0;
        let totalPoints = 0;
        let earnedPoints = 0;
        const incorrectQuestions: string[] = [];
        const strengths: string[] = [];
        const weaknesses: string[] = [];

        for (const question of quiz.questions) {
          const userAnswerIndex = answers[question.id];
          const isCorrect = userAnswerIndex === question.correctAnswer;
          const peso = question.peso_puntos || 1;

          totalPoints += peso;

          if (isCorrect) {
            correctCount++;
            earnedPoints += peso;
            strengths.push(question.question);
          } else {
            incorrectQuestions.push(question.id);
            weaknesses.push(question.question);
          }
        }

        const percentage = Math.round((earnedPoints / totalPoints) * 100);
        const passed = percentage >= quiz.passingScore;

        // Determine performance level
        let level: QuizAnalysis["level"];
        if (percentage >= 90) level = "excellent";
        else if (percentage >= 75) level = "good";
        else if (percentage >= 60) level = "needs-improvement";
        else level = "critical";

        // Generate analysis
        const analysis: QuizAnalysis = {
          score: correctCount,
          percentage,
          level,
          incorrectQuestions,
          strengths: strengths.slice(0, 3), // Top 3 strengths
          weaknesses: weaknesses.slice(0, 3), // Top 3 weaknesses
          recommendations: [], // Could be enhanced with AI recommendations
        };

        // Update ProgresoCuestionario with final results
        await ProgresoCuestionario.update({
          input: {
            progresoCuestionarioId: currentProgresoCuestionarioId,
            puntaje_obtenido: earnedPoints,
            aprobado: passed, // Store whether user passed or failed
            estado: "completado", // Always mark as completed when finishing
            fecha_completado: new Date().toISOString(),
            recomendaciones: undefined, // Will be populated by AI later
          },
        });

        return analysis;
      } catch (err) {
        console.error("Error submitting quiz:", err);
        throw new Error("Error al enviar el cuestionario");
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  /**
   * Fetch answers from a specific quiz attempt
   */
  const fetchAttemptAnswers = useCallback(
    async (
      progresoCuestionarioId: string,
      questions: QuizQuestionView[]
    ): Promise<Record<string, number>> => {
      try {
        const { Respuesta } = await getQueryFactories<MainTypes, "Respuesta">({
          entities: ["Respuesta"],
        });

        // Fetch all answers for this attempt with relations
        const respuestasRes = await Respuesta.list({
          filter: {
            progresoCuestionarioId: { eq: progresoCuestionarioId },
          },
          followNextToken: true,
          maxPages: 10,
          selectionSet: respuestaWithRelationsSelectionSet,
        });

        const answersMap: Record<string, number> = {};

        // Convert answers to the format needed by the quiz
        for (const respuesta of respuestasRes.items || []) {
          if (!respuesta.preguntaId || !respuesta.opcionId) continue;

          // Cast to proper type since we're using the selection set
          const respuestaWithRelations =
            respuesta as unknown as RespuestaWithRelations;
          if (respuestaWithRelations.Opcion) {
            const opcion = respuestaWithRelations.Opcion as OpcionFromRespuesta;

            // Find the question in the loaded questions to get the correct index
            const question = questions.find(
              (q) => q.id === respuesta.preguntaId
            );
            if (question && question.opcionIds) {
              const answerIndex = question.opcionIds.indexOf(
                respuesta.opcionId
              );
              if (answerIndex !== -1) {
                answersMap[respuesta.preguntaId] = answerIndex;
              }
            }
          }
        }

        return answersMap;
      } catch (err) {
        console.error("Error fetching attempt answers:", err);
        return {};
      }
    },
    []
  );

  /**
   * Reset answers state
   */
  const resetAnswers = useCallback(() => {
    setUserAnswers({});
    setError(null);
  }, []);

  return {
    // Data
    userAnswers,

    // State
    submitting,
    error,

    // Actions
    submitAnswer,
    submitQuiz,
    fetchAttemptAnswers,
    resetAnswers,
  };
};
