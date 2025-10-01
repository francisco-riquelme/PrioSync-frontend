import React from 'react';
import {
  PlayCircleOutline as VideoIcon,
  AudioFile as AudioIcon,
  Description as FileIcon,
  PictureAsPdf as PdfIcon,
  TextFields as TextIcon,
} from '@mui/icons-material';

// Type for MUI chip colors
export type ChipColor = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

/**
 * Get icon for material/lesson type (for lessons - supports pdf, text, default)
 */
export const getLessonTypeIcon = (tipo: string | null | undefined) => {
  switch (tipo) {
    case 'video':
      return <VideoIcon fontSize="small" color="primary" />;
    case 'audio':
      return <AudioIcon fontSize="small" color="secondary" />;
    case 'pdf':
      return <PdfIcon fontSize="small" color="error" />;
    case 'text':
      return <TextIcon fontSize="small" color="primary" />;
    case 'archivo':
      return <FileIcon fontSize="small" color="action" />;
    default:
      return <VideoIcon fontSize="small" color="action" />;
  }
};

/**
 * Get icon for material type (for study materials - supports video, audio, archivo)
 */
export const getMaterialTypeIcon = (tipo: string | null | undefined) => {
  switch (tipo) {
    case 'video':
      return <VideoIcon fontSize="small" color="primary" />;
    case 'audio':
      return <AudioIcon fontSize="small" color="secondary" />;
    case 'archivo':
      return <FileIcon fontSize="small" color="action" />;
    default:
      return <FileIcon fontSize="small" color="action" />;
  }
};

/**
 * Get chip color for material/lesson type
 */
export const getMaterialTypeColor = (tipo: string | null | undefined): ChipColor => {
  switch (tipo) {
    case 'video':
      return 'primary';
    case 'audio':
      return 'secondary';
    case 'archivo':
      return 'info';
    case 'pdf':
      return 'error';
    case 'text':
      return 'primary';
    default:
      return 'default';
  }
};

/**
 * Get human-readable label for material/lesson type
 */
export const getMaterialTypeLabel = (tipo: string | null | undefined) => {
  switch (tipo) {
    case 'video':
      return 'Video';
    case 'audio':
      return 'Audio';
    case 'archivo':
      return 'Archivo';
    case 'pdf':
      return 'PDF';
    case 'text':
      return 'Texto';
    default:
      return 'N/A';
  }
};

/**
 * Get human-readable label for material/lesson type (alternative version with "Contenido" default)
 */
export const getMaterialTypeLabelWithDefault = (tipo: string | null | undefined) => {
  const label = getMaterialTypeLabel(tipo);
  return label === 'N/A' ? 'Contenido' : label;
};

/**
 * Format duration in minutes to human-readable string
 * Examples: 45 min, 1h 30min, 2h
 */
export const formatDuration = (minutos: number | null | undefined): string => {
  if (!minutos) return '-';
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
};
