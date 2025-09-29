// Tipos para la funcionalidad de transcripción de videos

export interface VideoFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

// Metadatos del curso para la transcripción inteligente
export interface CourseMetadata {
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: CourseLevel;
  duration: string;
  language: Language;
  tags: string[];
  subject: string;
  targetAudience: string;
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export type Language = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt';

export interface VideoMetadata {
  title: string;
  description?: string;
  courseId: string;
  courseName: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  duration?: number; // En segundos
  uploadedAt: string;
}

// Representa el estado/registro de una transcripción en progreso o completada
export interface TranscriptionJobStatus {
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  result?: TranscriptionResult;
  error?: string;
  timestamp: string;
}

// Resultado de la transcripción con análisis de Gemini AI
export interface TranscriptionResult {
  transcript: string;
  metadata: CourseMetadata;
  processingInfo: {
    duration: number;
    model: string;
    timestamp: string;
  };
  analysis?: {
    summary: string;
    keyTopics: string[];
    difficulty: string;
    recommendations: string[];
  };
}

// Respuesta de la API al crear/consultar transcripción
export interface TranscriptionResponse {
  success: boolean;
  requestId: string;
  message: string;
  videoMetadata: VideoMetadata;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  transcriptionText?: string;
}

// Datos del formulario para subir video con metadatos educativos
export interface VideoUploadFormData extends CourseMetadata {
  video: File;
}

// Configuración de validación
export interface VideoValidationConfig {
  maxFileSize: number; // En bytes
  allowedTypes: string[];
  maxDuration?: number; // En segundos
}

// Respuesta de validación
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

// Estados de transcripción para el frontend
export type TranscriptionStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

// Opciones de cursos para el formulario
export interface CourseOption {
  id: string;
  name: string;
  description?: string;
}

// Configuraciones predefinidas
export const VIDEO_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/wmv', 'video/mkv'] as const,
  MAX_DURATION: 7200, // 2 horas en segundos
} as const;

export const TRANSCRIPTION_STATUS_LABELS = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
} as const;