// UI/View types for Quiz system
// These are transformations of schema types (MainTypes) for frontend consumption

import { MainTypes } from "@/utils/api/schema";

// Re-export schema types directly
export type Cuestionario = MainTypes["Cuestionario"]["type"];
export type Pregunta = MainTypes["Pregunta"]["type"];
export type OpcionPregunta = MainTypes["OpcionPregunta"]["type"];
export type Respuesta = MainTypes["Respuesta"]["type"];
export type ProgresoCuestionario = MainTypes["ProgresoCuestionario"]["type"];

// Transformed types for UI (combines Pregunta + OpcionPregunta[])
export interface QuizQuestionView {
  id: string; // preguntaId
  question: string; // texto_pregunta
  options: string[]; // OpcionPregunta[].texto
  correctAnswer: number; // index where es_correcta = true
  explanation?: string; // explicacion
  peso_puntos: number; // peso_puntos
  opcionIds: string[]; // OpcionPregunta[].opcionId for submission
}

// Transformed type for UI (combines Cuestionario + Pregunta[] + Curso)
export interface QuizDataView {
  id: string; // cuestionarioId
  courseId: string; // cursoId
  courseName: string; // Curso.titulo
  title: string; // titulo
  description: string; // descripcion
  timeLimit: number; // duracion_minutos
  questions: QuizQuestionView[]; // transformed Pregunta[] with OpcionPregunta[]
  passingScore: number; // calculated or configured threshold
}

// Alias for backward compatibility
export type QuizData = QuizDataView;

// Pure UI types (not in schema)
export interface StudyRecommendation {
  id: string;
  title: string;
  description: string;
  type: "course" | "module" | "practice" | "schedule";
  priority: "high" | "medium" | "low";
  icon: string;
  action: {
    type: "navigate" | "schedule" | "external";
    target: string;
    label: string;
  };
}

// Detalle de pregunta con respuesta del usuario
export interface QuestionDetail {
  question: string;
  userAnswer: string;
  correctAnswer?: string;
}

// Pure UI type (quiz result analysis)
export interface QuizAnalysis {
  score: number; // Puntos obtenidos (earnedPoints)
  totalPoints: number; // Puntos máximos posibles
  correctCount: number; // Número de respuestas correctas
  totalQuestions: number; // Número total de preguntas
  percentage: number;
  level: "excellent" | "good" | "needs-improvement" | "critical";
  incorrectQuestions: string[];
  strengths: string[]; // Deprecated: usar strengthDetails
  weaknesses: string[]; // Deprecated: usar weaknessDetails
  strengthDetails?: QuestionDetail[]; // Preguntas correctas con respuestas
  weaknessDetails?: QuestionDetail[]; // Preguntas incorrectas con respuestas
  recommendations: StudyRecommendation[];
  llmFeedback?: string; // Retroalimentación personalizada generada por LLM
  llmLoading?: boolean; // Estado de carga de la retroalimentación
  llmError?: string; // Error al generar retroalimentación
}
