'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Divider,
  Link,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  School as SchoolIcon,
  MenuBook as BookIcon,
  VideoLibrary as VideoIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { StudySessionDetailsProps } from './componentTypes';
import { useLessonDetail } from '@/components/courses/hooks/useLessonDetail';

const StudySessionDetails: React.FC<StudySessionDetailsProps> = ({
  open,
  onClose,
  onEdit,
  onDelete,
  session
}) => {
  const router = useRouter();
  
  // Fetch lesson data if leccionId exists
  // Hook will handle empty string gracefully (will fail but error is caught)
  const { leccion, loading: lessonLoading } = useLessonDetail({
    leccionId: session?.leccionId || ''
  });

  if (!session) return null;

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDuration = () => {
    const diffMs = session.endTime.getTime() - session.startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  const handleLessonClick = () => {
    if (session.leccionId) {
      router.push(`/courses/lecciones/${session.leccionId}`);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle 
        component="div"
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          pb: 1 
        }}
      >
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          Detalles de la Sesión
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Título */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            {session.title}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Información de Tiempo */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TimeIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Horario
            </Typography>
          </Box>
          <Typography variant="body1" gutterBottom>
            <strong>Inicio:</strong> {formatDateTime(session.startTime)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Fin:</strong> {formatDateTime(session.endTime)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Duración: {getDuration()}
          </Typography>
        </Box>

        {/* Información de Lección */}
        {session.leccionId && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BookIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Lección Asociada
                </Typography>
              </Box>
              {lessonLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Cargando información de la lección...
                </Typography>
              ) : leccion ? (
                <Box>
                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                    {leccion.titulo}
                  </Typography>
                  {leccion.descripcion && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {leccion.descripcion}
                    </Typography>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<BookIcon />}
                    endIcon={<OpenInNewIcon />}
                    onClick={handleLessonClick}
                    sx={{ mt: 1 }}
                  >
                    Ver Lección Completa
                  </Button>
                  {leccion.url_contenido && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <VideoIcon color="error" fontSize="small" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Video de YouTube
                        </Typography>
                      </Box>
                      <Link
                        href={leccion.url_contenido}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          wordBreak: 'break-all',
                        }}
                      >
                        {leccion.url_contenido}
                        <OpenInNewIcon fontSize="small" />
                      </Link>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No se pudo cargar la información de la lección
                </Typography>
              )}
            </Box>
          </>
        )}

        {/* Información de Curso (si no hay lección) */}
        {session.cursoId && !session.leccionId && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SchoolIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Curso Asociado
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<SchoolIcon />}
                endIcon={<OpenInNewIcon />}
                onClick={() => router.push(`/courses/${session.cursoId}`)}
                sx={{ mt: 1 }}
              >
                Ver Curso
              </Button>
            </Box>
          </>
        )}

        {/* Fechas de creación */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Creado: {formatDateTime(session.createdAt)}
          </Typography>
          {session.updatedAt && session.updatedAt !== session.createdAt && (
            <Typography variant="body2" color="text.secondary">
              Actualizado: {formatDateTime(session.updatedAt)}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onEdit}
          variant="outlined"
          startIcon={<EditIcon />}
          sx={{ flex: 1 }}
        >
          Editar
        </Button>
        <Button
          onClick={onDelete}
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          sx={{ flex: 1 }}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudySessionDetails;