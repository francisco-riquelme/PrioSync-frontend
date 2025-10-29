import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import { useState } from 'react';
import { CourseListItem } from '@/components/courses/hooks/useCoursesListData';
import type { MainTypes } from '@/utils/api/schema';

// Type for courses from UserContext
interface CursoFromUsuario {
  readonly cursoId: string;
  readonly titulo: string;
  readonly descripcion: string | null;
  readonly imagen_portada: string | null;
  readonly duracion_estimada: number | null;
  readonly nivel_dificultad: "basico" | "intermedio" | "avanzado" | null;
  readonly estado: "activo" | "inactivo" | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

interface CourseCardProps {
  course: CourseListItem | CursoFromUsuario;
  onCourseClick: (courseId: number | string) => void;
  progreso?: number; // 0-100, opcional
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  return `${hours} horas`;
};

const getLevelColor = (level: string) => {
  switch (level) {
    case 'basico': return 'success';
    case 'intermedio': return 'warning';
    case 'avanzado': return 'error';
    default: return 'default';
  }
};

export const CourseCard = ({ course, onCourseClick, progreso }: CourseCardProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    // Image loaded successfully, no action needed
  };

  const hasImage = course.imagen_portada && !imageError;

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
        transition: 'all 0.2s ease-in-out',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={() => onCourseClick(course.cursoId)}
    >
      {/* Course Image or Fallback */}
      {hasImage ? (
        <CardMedia
          component="img"
          height="160"
          image={course.imagen_portada}
          alt={course.titulo}
          onError={handleImageError}
          onLoad={handleImageLoad}
          sx={{ 
            backgroundColor: 'grey.200',
            objectFit: 'cover',
            width: '100%'
          }}
        />
      ) : (
        <Box
          sx={{
            height: 160,
            backgroundColor: 'primary.50',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.main',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <SchoolIcon sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
            {course.titulo}
          </Typography>
        </Box>
      )}
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          display: 'grid',
          gridTemplateRows: progreso !== undefined ? 'auto auto 1fr auto auto' : 'auto auto 1fr auto',
          gap: 1,
          alignContent: 'start',
        }}
      >
        {/* Chips de nivel y duración */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label={course.nivel_dificultad} 
            size="small" 
            color={getLevelColor(course.nivel_dificultad || '')}
            variant="outlined"
          />
          <Chip 
            label={formatDuration(course.duracion_estimada || 0)} 
            size="small" 
            variant="outlined"
          />
        </Box>
        
        {/* Título del curso */}
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {course.titulo}
        </Typography>
        
        {/* Descripción con truncado flexible */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.4,
            alignSelf: 'start',
          }}
        >
          {course.descripcion}
        </Typography>

        {/* Barra de progreso (solo si existe) */}
        {progreso !== undefined && progreso >= 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progreso
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {progreso}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progreso}
              sx={{
                height: 6,
                borderRadius: 2,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 2,
                  backgroundColor: 'success.main',
                },
              }}
            />
          </Box>
        )}

        {/* Botón de acción */}
        <Button
          variant="contained"
          fullWidth
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            onCourseClick(course.cursoId);
          }}
          sx={{
            textTransform: 'none',
            py: 1,
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          Ver Curso
        </Button>
      </CardContent>
    </Card>
  );
};
