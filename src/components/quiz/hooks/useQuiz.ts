import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import {
  QuizDataView,
  QuizQuestionView,
  QuizAnalysis,
  Cuestionario,
  Pregunta,
  OpcionPregunta,
  Respuesta,
  ProgresoCuestionario,
} from "@/types/quiz";

type Curso = MainTypes["Curso"]["type"];

// Quiz attempt with extended info
export interface QuizAttempt extends ProgresoCuestionario {
  cuestionarioTitulo?: string;
  totalPreguntas?: number;
}

// Simple interface for loaded question data
interface LoadedPreguntaData {
  pregunta: Pregunta;
  opciones: OpcionPregunta[];
}

// Extended Cuestionario with question count
export interface CuestionarioWithStats extends Cuestionario {
  questionCount?: number;
}

// Extended types for quiz operations
export interface QuizAnswer {
  preguntaId: string;
  opcionId: string;
  respuesta_texto?: string; // For open-ended questions
  esCorrecta: boolean;
}

export interface UseQuizParams {
  cuestionarioId?: string;
  cursoId?: string;
  usuarioId: string;
  autoLoad?: boolean;
}

export interface UseQuizReturn {
  // Quiz data (single quiz scenario)
  quiz: QuizDataView | null;
  cuestionario: Cuestionario | null;
  questions: QuizQuestionView[];

  // Multiple quizzes (course scenario)
  cuestionarios: CuestionarioWithStats[];

  // Quiz attempts
  attempts: QuizAttempt[];
  currentAttemptNumber: number;

  // User answers
  userAnswers: Record<string, string>;

  // State
  loading: boolean;
  submitting: boolean;
  error: string | null;

  // Actions
  loadQuiz: () => Promise<void>;
  loadQuizByCourse: (courseId: string) => Promise<void>;
  fetchAttempts: (cuestionarioId: string) => Promise<QuizAttempt[]>;
  fetchAttemptAnswers: (
    progresoCuestionarioId: string
  ) => Promise<Record<string, number>>;
  startQuizAttempt: () => Promise<string>;
  continueAttempt: (progresoCuestionarioId: string) => void;
  clearCurrentAttempt: () => void;
  submitAnswer: (
    questionId: string,
    opcionId: string,
    answerText?: string
  ) => Promise<void>;
  submitQuiz: (answers: Record<string, number>) => Promise<QuizAnalysis>;
  resetQuiz: () => void;
  refetch: () => Promise<void>;
  refreshAttempts: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing quiz data
 *
 * Features:
 * - Fetch quiz by cuestionarioId or cursoId
 * - Load questions with their options
 * - Submit individual answers
 * - Submit complete quiz and calculate score
 * - Generate quiz analysis
 *
 * @param params - Configuration for the quiz hook
 * @returns Quiz data, state, and action handlers
 *
 * @example
 * ```typescript
 * const { quiz, loading, submitAnswer, submitQuiz } = useQuiz({
 *   cuestionarioId: "quiz-123",
 *   usuarioId: "user-456"
 * });
 *
 * // Or load all quizzes for a course
 * const { cuestionarios, loading } = useQuiz({
 *   cursoId: "1",
 *   usuarioId: "user-456"
 * });
 * ```
 */
export const useQuiz = (params: UseQuizParams): UseQuizReturn => {
  const { cuestionarioId, cursoId, usuarioId, autoLoad = true } = params;

  // State management
  const [quiz, setQuiz] = useState<QuizDataView | null>(null);
  const [cuestionario, setCuestionario] = useState<Cuestionario | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionView[]>([]);
  const [cuestionarios, setCuestionarios] = useState<CuestionarioWithStats[]>(
    []
  );
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [currentAttemptNumber, setCurrentAttemptNumber] = useState(1);
  const [currentProgresoCuestionarioId, setCurrentProgresoCuestionarioId] =
    useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  /**
   * Transform database Pregunta records (with Opciones) into QuizQuestionView format
   */
  const transformPreguntasToQuestions = (
    preguntasData: LoadedPreguntaData[]
  ): QuizQuestionView[] => {
    return preguntasData.map(({ pregunta, opciones }) => {
      // Sort options by orden field if available
      const sortedOpciones = [...opciones].sort(
        (a, b) => (a.orden || 0) - (b.orden || 0)
      );

      // Find correct answer index
      const correctAnswerIndex = sortedOpciones.findIndex(
        (opcion) => opcion.es_correcta
      );

      return {
        id: pregunta.preguntaId,
        question: pregunta.texto_pregunta,
        options: sortedOpciones.map((opcion) => opcion.texto),
        correctAnswer: correctAnswerIndex,
        explanation: pregunta.explicacion || undefined,
        peso_puntos: pregunta.peso_puntos || 1,
        // Store opcion IDs for answer submission
        opcionIds: sortedOpciones.map((opcion) => opcion.opcionId),
      };
    });
  };

  /**
   * Transform Cuestionario and Pregunta data into QuizDataView format
   */
  const transformToQuizData = useCallback(
    (
      cuest: Cuestionario,
      preguntasData: LoadedPreguntaData[],
      course?: Curso | null
    ): QuizDataView => {
      const transformedQuestions = transformPreguntasToQuestions(preguntasData);

      return {
        id: cuest.cuestionarioId,
        courseId: cuest.cursoId,
        courseName: course?.titulo || "Curso",
        title: cuest.titulo,
        description: cuest.descripcion || "",
        timeLimit: cuest.duracion_minutos || 30,
        passingScore: cuest.porcentaje_aprobacion || 70, // Use schema field, default to 70%
        questions: transformedQuestions,
      };
    },
    []
  );

  /**
   * Load quiz by cuestionarioId
   */
  const loadQuiz = useCallback(async () => {
    if (!cuestionarioId) {
      setError("No se proporcionó ID del cuestionario");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { Cuestionario, Pregunta, OpcionPregunta, Curso } =
        await getQueryFactories<
          MainTypes,
          "Cuestionario" | "Pregunta" | "OpcionPregunta" | "Curso"
        >({
          entities: ["Cuestionario", "Pregunta", "OpcionPregunta", "Curso"],
        });

      // Fetch quiz/cuestionario
      const cuest = await Cuestionario.get({
        input: { cuestionarioId },
      });

      if (!cuest) {
        throw new Error("Cuestionario no encontrado");
      }

      setCuestionario(cuest);

      // Fetch questions
      const preguntasRes = await Pregunta.list({
        filter: {
          cuestionarioId: { eq: cuestionarioId },
        },
        followNextToken: true,
        maxPages: 10,
      });

      // Fetch options for each question
      const preguntasData: LoadedPreguntaData[] = await Promise.all(
        (preguntasRes.items || []).map(async (pregunta) => {
          const opcionesRes = await OpcionPregunta.list({
            filter: {
              preguntaId: { eq: pregunta.preguntaId },
            },
            followNextToken: true,
            maxPages: 5,
          });

          return {
            pregunta,
            opciones: opcionesRes.items || [],
          };
        })
      );

      // Sort questions by orden field
      let sortedPreguntasData = preguntasData.sort(
        (a, b) => (a.pregunta.orden || 0) - (b.pregunta.orden || 0)
      );

      // Randomize questions if preguntas_aleatorias is true
      if (cuest.preguntas_aleatorias) {
        sortedPreguntasData = shuffleArray(sortedPreguntasData);
      }

      setQuestions(transformPreguntasToQuestions(sortedPreguntasData));

      // Fetch course data for context
      let course: Curso | null = null;
      if (cuest.cursoId) {
        try {
          course = await Curso.get({
            input: { cursoId: cuest.cursoId },
          });
        } catch (err) {
          console.warn("Could not fetch course data:", err);
        }
      }

      // Transform to QuizData format
      const quizData = transformToQuizData(cuest, sortedPreguntasData, course);
      setQuiz(quizData);

      // Fetch attempts for this quiz - inline to avoid circular dependency
      try {
        const { ProgresoCuestionario: ProgresoCuest } = await getQueryFactories<
          MainTypes,
          "ProgresoCuestionario"
        >({
          entities: ["ProgresoCuestionario"],
        });

        const attemptsRes = await ProgresoCuest.list({
          filter: {
            usuarioId: { eq: usuarioId },
            cuestionarioId: { eq: cuestionarioId },
          },
          followNextToken: true,
          maxPages: 10,
        });

        const sortedAttempts = (attemptsRes.items || []).sort(
          (a, b) => (a.intento_numero || 0) - (b.intento_numero || 0)
        );

        const enrichedAttempts: QuizAttempt[] = sortedAttempts.map(
          (attempt) => ({
            ...attempt,
            cuestionarioTitulo: cuest.titulo,
          })
        );

        setAttempts(enrichedAttempts);

        const maxAttempt = Math.max(
          0,
          ...sortedAttempts.map((a) => a.intento_numero || 0)
        );
        setCurrentAttemptNumber(maxAttempt + 1);
      } catch (err) {
        console.warn("Could not fetch attempts:", err);
        // Don't fail the entire load if attempts fetch fails
      }
    } catch (err) {
      console.error("Error loading quiz:", err);
      setError(
        "Error al cargar el cuestionario. Por favor, intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }, [cuestionarioId, transformToQuizData, usuarioId]);

  /**
   * Load all quizzes for a course
   */
  const loadQuizByCourse = useCallback(async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { Cuestionario, Pregunta } = await getQueryFactories<
        MainTypes,
        "Cuestionario" | "Pregunta"
      >({
        entities: ["Cuestionario", "Pregunta"],
      });

      // Fetch ALL cuestionarios for this course
      const cuestionariosRes = await Cuestionario.list({
        filter: {
          cursoId: { eq: courseId },
        },
        followNextToken: true,
        maxPages: 10,
      });

      if (!cuestionariosRes.items || cuestionariosRes.items.length === 0) {
        setCuestionarios([]);
        return;
      }

      // Fetch question counts for each cuestionario
      const cuestionariosWithStats = await Promise.all(
        cuestionariosRes.items.map(async (cuestionario) => {
          try {
            const preguntasRes = await Pregunta.list({
              filter: {
                cuestionarioId: { eq: cuestionario.cuestionarioId },
              },
              followNextToken: true,
              maxPages: 1,
            });

            return {
              ...cuestionario,
              questionCount: preguntasRes.items?.length || 0,
            };
          } catch (err) {
            console.warn(
              `Error fetching questions for quiz ${cuestionario.cuestionarioId}:`,
              err
            );
            return {
              ...cuestionario,
              questionCount: 0,
            };
          }
        })
      );

      setCuestionarios(cuestionariosWithStats);
    } catch (err) {
      console.error("Error loading quizzes by course:", err);
      setError(
        "Error al cargar los cuestionarios. Por favor, intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all quiz attempts for a user
   */
  const fetchAttempts = useCallback(
    async (quizId: string): Promise<QuizAttempt[]> => {
      try {
        setLoading(true);
        setError(null);

        const { ProgresoCuestionario, Cuestionario } = await getQueryFactories<
          MainTypes,
          "ProgresoCuestionario" | "Cuestionario"
        >({
          entities: ["ProgresoCuestionario", "Cuestionario"],
        });

        // Use the secondary index to query all attempts for this user/quiz
        const attemptsRes = await ProgresoCuestionario.list({
          filter: {
            usuarioId: { eq: usuarioId },
            cuestionarioId: { eq: quizId },
          },
          followNextToken: true,
          maxPages: 10,
        });

        // Sort by attempt number
        const sortedAttempts = (attemptsRes.items || []).sort(
          (a, b) => (a.intento_numero || 0) - (b.intento_numero || 0)
        );

        // Fetch quiz title if available
        let quizTitle = "";
        try {
          const cuest = await Cuestionario.get({
            input: { cuestionarioId: quizId },
          });
          quizTitle = cuest?.titulo || "";
        } catch (err) {
          console.warn("Could not fetch quiz title:", err);
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
    [usuarioId]
  );

  /**
   * Fetch answers from a specific quiz attempt
   */
  const fetchAttemptAnswers = useCallback(
    async (progresoCuestionarioId: string): Promise<Record<string, number>> => {
      try {
        setLoading(true);

        const { Respuesta, OpcionPregunta } = await getQueryFactories<
          MainTypes,
          "Respuesta" | "OpcionPregunta"
        >({
          entities: ["Respuesta", "OpcionPregunta"],
        });

        // Fetch all answers for this attempt
        const respuestasRes = await Respuesta.list({
          filter: {
            progresoCuestionarioId: { eq: progresoCuestionarioId },
          },
          followNextToken: true,
          maxPages: 10,
        });

        const answersMap: Record<string, number> = {};

        // Convert answers to the format needed by the quiz
        for (const respuesta of respuestasRes.items || []) {
          if (!respuesta.preguntaId || !respuesta.opcionId) continue;

          // Find the option to get its position/index
          const opcion = await OpcionPregunta.get({
            input: { opcionId: respuesta.opcionId },
          });

          if (opcion) {
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
      } finally {
        setLoading(false);
      }
    },
    [questions]
  );

  /**
   * Start a new quiz attempt - creates ProgresoCuestionario record
   */
  const startQuizAttempt = useCallback(async (): Promise<string> => {
    if (!cuestionario) {
      throw new Error("No quiz loaded");
    }

    try {
      const { ProgresoCuestionario } = await getQueryFactories<
        MainTypes,
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
          cuestionarioId: cuestionario.cuestionarioId,
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
  }, [cuestionario, usuarioId, currentAttemptNumber]);

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
   * Submit a single answer to a question
   * Creates a new answer or updates existing one
   */
  const submitAnswer = useCallback(
    async (questionId: string, opcionId: string, answerText?: string) => {
      if (!cuestionario) {
        throw new Error("No quiz loaded");
      }

      // Ensure we have a progresoCuestionarioId
      let progresoCuestionarioId = currentProgresoCuestionarioId;
      if (!progresoCuestionarioId) {
        progresoCuestionarioId = await startQuizAttempt();
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
          const opcion = await OpcionPregunta.get({
            input: { opcionId },
          });
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
        });

        const existingAnswer = existingAnswersRes.items?.[0];

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
      } catch (err) {
        console.error("Error submitting answer:", err);
        throw new Error("Error al guardar la respuesta");
      } finally {
        setSubmitting(false);
      }
    },
    [
      cuestionario,
      usuarioId,
      currentProgresoCuestionarioId,
      startQuizAttempt,
      questions,
    ]
  );

  /**
   * Submit complete quiz and calculate score
   * Updates the existing ProgresoCuestionario record (answers already saved)
   */
  const submitQuiz = useCallback(
    async (answers: Record<string, number>): Promise<QuizAnalysis> => {
      if (!quiz || !cuestionario) {
        throw new Error("No quiz loaded");
      }

      // Ensure we have a progresoCuestionarioId
      // If user somehow submits without answering anything, create an attempt
      let progresoCuestionarioId = currentProgresoCuestionarioId;
      if (!progresoCuestionarioId) {
        progresoCuestionarioId = await startQuizAttempt();
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
            progresoCuestionarioId: progresoCuestionarioId,
            puntaje_obtenido: earnedPoints,
            aprobado: passed, // Store whether user passed or failed
            estado: "completado", // Always mark as completed when finishing
            fecha_completado: new Date().toISOString(),
            recomendaciones: undefined, // Will be populated by AI later
          },
        });

        // Update current attempt number
        setCurrentAttemptNumber((prev) => prev + 1);

        // Clear current attempt ID
        setCurrentProgresoCuestionarioId(null);

        return analysis;
      } catch (err) {
        console.error("Error submitting quiz:", err);
        throw new Error("Error al enviar el cuestionario");
      } finally {
        setSubmitting(false);
      }
    },
    [quiz, cuestionario, currentProgresoCuestionarioId, startQuizAttempt]
  );

  /**
   * Refresh attempts for the current quiz
   */
  const refreshAttempts = useCallback(async () => {
    if (!cuestionarioId) return;

    try {
      const { ProgresoCuestionario } = await getQueryFactories<
        MainTypes,
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
      });

      const sortedAttempts = (attemptsRes.items || []).sort(
        (a, b) => (a.intento_numero || 0) - (b.intento_numero || 0)
      );

      const enrichedAttempts: QuizAttempt[] = sortedAttempts.map((attempt) => ({
        ...attempt,
        cuestionarioTitulo: cuestionario?.titulo,
      }));

      setAttempts(enrichedAttempts);

      const maxAttempt = Math.max(
        0,
        ...sortedAttempts.map((a) => a.intento_numero || 0)
      );
      setCurrentAttemptNumber(maxAttempt + 1);
    } catch (err) {
      console.warn("Could not refresh attempts:", err);
    }
  }, [cuestionarioId, usuarioId, cuestionario?.titulo]);

  /**
   * Reset quiz state
   */
  const resetQuiz = useCallback(() => {
    setQuiz(null);
    setCuestionario(null);
    setQuestions([]);
    setCuestionarios([]);
    setAttempts([]);
    setCurrentAttemptNumber(1);
    setCurrentProgresoCuestionarioId(null);
    setUserAnswers({});
    setError(null);
  }, []);

  /**
   * Refetch quiz data
   */
  const refetch = useCallback(async () => {
    if (cuestionarioId) {
      await loadQuiz();
    } else if (cursoId) {
      await loadQuizByCourse(cursoId);
    }
  }, [cuestionarioId, cursoId, loadQuiz, loadQuizByCourse]);

  // Auto-load on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad && cuestionarioId) {
      loadQuiz();
    } else if (autoLoad && cursoId) {
      loadQuizByCourse(cursoId);
    }
  }, [autoLoad, cuestionarioId, cursoId, loadQuiz, loadQuizByCourse]);

  return {
    // Data
    quiz,
    cuestionario,
    questions,
    cuestionarios,
    attempts,
    currentAttemptNumber,
    userAnswers,

    // State
    loading,
    submitting,
    error,

    // Actions
    loadQuiz,
    loadQuizByCourse,
    fetchAttempts,
    fetchAttemptAnswers,
    startQuizAttempt,
    continueAttempt,
    clearCurrentAttempt,
    submitAnswer,
    submitQuiz,
    resetQuiz,
    refetch,
    refreshAttempts,
  };
};

// No need to re-export types - they're already exported from @/types/quiz
