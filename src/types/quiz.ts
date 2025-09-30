// Tipos de dominio para el sistema de Quiz

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizData {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  timeLimit: number; // en minutos
  questions: QuizQuestion[];
  passingScore: number; // porcentaje
}

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

export interface QuizAnalysis {
  score: number;
  percentage: number;
  level: "excellent" | "good" | "needs-improvement" | "critical";
  incorrectQuestions: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: StudyRecommendation[];
}
