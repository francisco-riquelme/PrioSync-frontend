// Tipos para la funcionalidad de transcripción de videos

export interface VideoFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

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
  id: string;
  videoMetadata: VideoMetadata;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  transcriptionText?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
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

// Datos del formulario para subir video
export interface VideoUploadFormData {
  title: string;
  description?: string;
  courseId: string;
  courseName: string;
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
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_TYPES: ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime'] as const,
  MAX_DURATION: 3600, // 1 hora en segundos
} as const;

export const TRANSCRIPTION_STATUS_LABELS = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
} as const;