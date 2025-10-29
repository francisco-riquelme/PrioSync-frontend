/**
 * Tipos y constantes para el sistema de evaluación de cursos
 */

/**
 * Tipo de evaluación de curso desde la base de datos
 */
export interface EvaluacionCurso {
  calificacion?: number;
  comentario?: string;
  fecha_evaluacion?: string;
  cursoId: string;
  usuarioId: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Datos del formulario de evaluación
 */
export interface EvaluacionFormData {
  calificacion: number;
  comentario: string;
}

/**
 * Constantes para el sistema de rating
 */
export const RATING_CONFIG = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 0,
  LABELS: {
    1: 'Muy malo',
    2: 'Malo',
    3: 'Regular',
    4: 'Bueno',
    5: 'Excelente',
  } as Record<number, string>,
} as const;

/**
 * Mensajes de validación
 */
export const VALIDATION_MESSAGES = {
  RATING_REQUIRED: 'Por favor selecciona una calificación',
  COMMENT_MIN_LENGTH: 'El comentario debe tener al menos 10 caracteres',
  COMMENT_MAX_LENGTH: 'El comentario no puede exceder 500 caracteres',
} as const;

/**
 * Validar datos de evaluación
 */
export function validateEvaluacion(data: EvaluacionFormData): {
  isValid: boolean;
  errors: Partial<Record<keyof EvaluacionFormData, string>>;
} {
  const errors: Partial<Record<keyof EvaluacionFormData, string>> = {};

  if (!data.calificacion || data.calificacion < RATING_CONFIG.MIN || data.calificacion > RATING_CONFIG.MAX) {
    errors.calificacion = VALIDATION_MESSAGES.RATING_REQUIRED;
  }

  if (data.comentario && data.comentario.length < 10) {
    errors.comentario = VALIDATION_MESSAGES.COMMENT_MIN_LENGTH;
  }

  if (data.comentario && data.comentario.length > 500) {
    errors.comentario = VALIDATION_MESSAGES.COMMENT_MAX_LENGTH;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
