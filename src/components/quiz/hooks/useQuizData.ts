import { useState, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";
import {
  QuizDataView,
  QuizQuestionView,
  Cuestionario,
  Pregunta,
  OpcionPregunta,
} from "@/types/quiz";

type Curso = MainTypes["Curso"]["type"];

// Define selection sets as const arrays
const cuestionarioWithRelationsSelectionSet = [
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
  "Curso.cursoId",
  "Curso.titulo",
  "Curso.descripcion",
  "Curso.imagen_portada",
  "Curso.duracion_estimada",
  "Curso.nivel_dificultad",
  "Curso.estado",
  "Curso.progreso_estimado",
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

// const basicCuestionarioSelectionSet = [
//   "cuestionarioId",
//   "titulo",
//   "descripcion",
//   "tipo",
//   "puntos_maximos",
//   "duracion_minutos",
//   "intentos_permitidos",
//   "preguntas_aleatorias",
//   "porcentaje_aprobacion",
//   "cursoId",
//   "moduloId",
//   "materialEstudioId",
// ] as const;

// Use SelectionSet to infer proper types
type CuestionarioWithRelations = SelectionSet<
  Cuestionario,
  typeof cuestionarioWithRelationsSelectionSet
>;
// type BasicCuestionario = SelectionSet<
//   Cuestionario,
//   typeof basicCuestionarioSelectionSet
// >;

// Extract nested types for easier access
type PreguntaFromCuestionario = NonNullable<
  CuestionarioWithRelations["Preguntas"]
>[0];
// type OpcionFromPregunta = NonNullable<PreguntaFromCuestionario["Opciones"]>[0];
// type CursoFromCuestionario = NonNullable<CuestionarioWithRelations["Curso"]>;

// Simple interface for loaded question data
interface LoadedPreguntaData {
  pregunta: Pregunta;
  opciones: OpcionPregunta[];
}

// Extended Cuestionario with question count
export interface CuestionarioWithStats extends Cuestionario {
  questionCount?: number;
}

export interface UseQuizDataReturn {
  // Quiz data (single quiz scenario)
  quiz: QuizDataView | null;
  cuestionario: Cuestionario | null;
  questions: QuizQuestionView[];

  // Multiple quizzes (course scenario)
  cuestionarios: CuestionarioWithStats[];

  // State
  loading: boolean;
  error: string | null;

  // Actions
  loadQuiz: (cuestionarioId: string) => Promise<void>;
  loadQuizByCourse: (courseId: string) => Promise<void>;
  resetQuiz: () => void;
}

export interface UseQuizDataParams {
  autoLoad?: boolean;
}

/**
 * Hook for loading quiz data (questions, options, course info)
 */
export const useQuizData = (): UseQuizDataReturn => {
  // const { autoLoad = false } = params;

  // State management
  const [quiz, setQuiz] = useState<QuizDataView | null>(null);
  const [cuestionario, setCuestionario] = useState<Cuestionario | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionView[]>([]);
  const [cuestionarios, setCuestionarios] = useState<CuestionarioWithStats[]>(
    []
  );
  const [loading, setLoading] = useState(false);
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
        passingScore: cuest.porcentaje_aprobacion || 70,
        questions: transformedQuestions,
      };
    },
    []
  );

  /**
   * Load quiz by cuestionarioId
   */
  const loadQuiz = useCallback(
    async (cuestionarioId: string) => {
      try {
        setLoading(true);
        setError(null);

        const { Cuestionario } = await getQueryFactories<
          MainTypes,
          "Cuestionario"
        >({
          entities: ["Cuestionario"],
        });

        // Fetch quiz/cuestionario with relations using selectionSet
        const cuest = (await Cuestionario.get({
          input: { cuestionarioId },
          selectionSet: cuestionarioWithRelationsSelectionSet,
        })) as unknown as CuestionarioWithRelations;

        if (!cuest) {
          throw new Error("Cuestionario no encontrado");
        }

        setCuestionario(cuest as unknown as Cuestionario);

        // Extract questions and options from the loaded cuestionario
        const preguntasData: LoadedPreguntaData[] = [];

        if (cuest.Preguntas) {
          for (const pregunta of cuest.Preguntas) {
            const preguntaWithOpciones =
              pregunta as unknown as PreguntaFromCuestionario;
            const opciones: OpcionPregunta[] = [];

            if (preguntaWithOpciones.Opciones) {
              for (const opcion of preguntaWithOpciones.Opciones) {
                opciones.push(opcion as unknown as OpcionPregunta);
              }
            }

            preguntasData.push({
              pregunta: preguntaWithOpciones as unknown as Pregunta,
              opciones,
            });
          }
        }

        // Sort questions by orden field
        let sortedPreguntasData = preguntasData.sort(
          (a, b) => (a.pregunta.orden || 0) - (b.pregunta.orden || 0)
        );

        // Randomize questions if preguntas_aleatorias is true
        if (cuest.preguntas_aleatorias) {
          sortedPreguntasData = shuffleArray(sortedPreguntasData);
        }

        setQuestions(transformPreguntasToQuestions(sortedPreguntasData));

        // Extract course data from the loaded cuestionario
        let course: Curso | null = null;
        if (cuest.Curso) {
          course = cuest.Curso as unknown as Curso;
        }

        // Transform to QuizData format
        const quizData = transformToQuizData(
          cuest as unknown as Cuestionario,
          sortedPreguntasData,
          course
        );
        setQuiz(quizData);
      } catch (err) {
        console.error("Error loading quiz:", err);
        setError(
          "Error al cargar el cuestionario. Por favor, intenta nuevamente."
        );
      } finally {
        setLoading(false);
      }
    },
    [transformToQuizData]
  );

  /**
   * Load all quizzes for a course
   */
  const loadQuizByCourse = useCallback(async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { Cuestionario } = await getQueryFactories<
        MainTypes,
        "Cuestionario"
      >({
        entities: ["Cuestionario"],
      });

      // Fetch ALL cuestionarios for this course using selectionSet with relations
      const cuestionariosRes = await Cuestionario.list({
        filter: {
          cursoId: { eq: courseId },
        },
        followNextToken: true,
        maxPages: 10,
        selectionSet: cuestionarioWithRelationsSelectionSet,
      });

      if (!cuestionariosRes.items || cuestionariosRes.items.length === 0) {
        setCuestionarios([]);
        return;
      }

      // Extract question counts from the loaded cuestionarios with relations
      const cuestionariosWithStats = cuestionariosRes.items.map(
        (cuestionario) => {
          const cuestionarioWithRelations =
            cuestionario as unknown as CuestionarioWithRelations;
          const questionCount =
            cuestionarioWithRelations.Preguntas?.length || 0;

          return {
            ...cuestionario,
            questionCount,
          };
        }
      );

      setCuestionarios(
        cuestionariosWithStats as unknown as CuestionarioWithStats[]
      );
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
   * Reset quiz state
   */
  const resetQuiz = useCallback(() => {
    setQuiz(null);
    setCuestionario(null);
    setQuestions([]);
    setCuestionarios([]);
    setError(null);
  }, []);

  return {
    // Data
    quiz,
    cuestionario,
    questions,
    cuestionarios,

    // State
    loading,
    error,

    // Actions
    loadQuiz,
    loadQuizByCourse,
    resetQuiz,
  };
};
