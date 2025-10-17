import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import { useState } from 'react';
import { CourseListItem } from '@/components/courses/hooks/useCoursesListData';
import type { MainTypes } from '@/utils/api/schema';
import type { SelectionSet } from 'aws-amplify/data';

// Type for courses from UserContext using SelectionSet
type Usuario = MainTypes["Usuario"]["type"];
type UserCoursesSelectionSet = [
  'Cursos.cursoId',
  'Cursos.titulo',
  'Cursos.descripcion',
  'Cursos.imagen_portada',
  'Cursos.duracion_estimada',
  'Cursos.nivel_dificultad',
  'Cursos.estado',
  'Cursos.createdAt',
  'Cursos.updatedAt'
];

type UserCourse = NonNullable<SelectionSet<Usuario, UserCoursesSelectionSet>["Cursos"]>[0];

interface CourseCardProps {
  course: CourseListItem | UserCourse;
  onCourseClick: (courseId: number | string) => void;
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

export const CourseCard = ({ course, onCourseClick }: CourseCardProps) => {
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
          gridTemplateRows: 'auto auto 1fr auto',
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
