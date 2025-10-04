// Tipos para la funcionalidad de YouTube e importación de playlists

// Información básica de un video de YouTube
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  duration: string; // Formato ISO 8601 (PT4M13S)
  thumbnailUrl: string;
  publishedAt: string;
  viewCount?: number;
  position: number; // Posición en la playlist
}

// Información de una playlist de YouTube
export interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  itemCount: number;
  videos: YouTubeVideo[];
}

// Estructura de un módulo del curso generado
export interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: CourseLesson[];
  estimatedDuration: string; // Duración total estimada del módulo
}

// Estructura de una lección del curso
export interface CourseLesson {
  id: string;
  title: string;
  description: string;
  order: number;
  youtubeVideoId: string;
  duration: string;
  objectives: string[]; // Objetivos de aprendizaje de la lección
  keyTopics: string[]; // Temas principales cubiertos
}

// Estructura completa del curso generada por LLM
export interface GeneratedCourseStructure {
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string; // Duración total del curso
  instructor: string;
  objectives: string[]; // Objetivos generales del curso
  modules: CourseModule[];
  tags: string[];
  prerequisites?: string[];
  targetAudience: string;
}

// Respuesta de la API de YouTube
export interface YouTubePlaylistResponse {
  success: boolean;
  data?: YouTubePlaylist;
  error?: string;
}

// Respuesta de la API de generación de estructura de curso
export interface CourseGenerationResponse {
  success: boolean;
  data?: GeneratedCourseStructure;
  error?: string;
  processingTime?: number; // Tiempo de procesamiento en ms
}

// Estado del proceso de importación
export type ImportStatus = 'idle' | 'fetching-playlist' | 'generating-structure' | 'completed' | 'error';

// Datos del proceso de importación
export interface ImportProgress {
  status: ImportStatus;
  currentStep: string;
  progress: number; // 0-100
  error?: string;
}

// Configuración para validación de URLs de YouTube
export interface YouTubeUrlValidation {
  isValid: boolean;
  playlistId?: string;
  error?: string;
}

// Metadatos adicionales para personalización del curso
export interface CourseCustomization {
  title?: string;
  description?: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  instructor?: string;
  targetAudience?: string;
  customObjectives?: string[];
  customTags?: string[];
}