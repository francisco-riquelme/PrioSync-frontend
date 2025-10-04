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

// Pure UI type (quiz result analysis)
export interface QuizAnalysis {
  score: number;
  percentage: number;
  level: "excellent" | "good" | "needs-improvement" | "critical";
  incorrectQuestions: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: StudyRecommendation[];
}
