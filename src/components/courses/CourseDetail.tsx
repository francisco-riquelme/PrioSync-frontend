'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

interface CourseData {
  id_curso: number;
  titulo: string;
  descripcion: string;
  imagen_portada: string;
  duracion_estimada: number;
  nivel_dificultad: 'basico' | 'intermedio' | 'avanzado';
  estado: 'activo' | 'inactivo';
}

// Datos de ejemplo - coinciden con el esquema de la base de datos
const courseData: Record<string, CourseData> = {
  '1': {
    id_curso: 1,
    titulo: 'Cálculo Avanzado',
    descripcion: 'Curso completo de cálculo diferencial e integral',
    imagen_portada: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 1800, // 30 horas
    nivel_dificultad: 'intermedio',
    estado: 'activo',
  },
  '2': {
    id_curso: 2,
    titulo: 'Desarrollo de Software',
    descripcion: 'Fundamentos de programación y desarrollo de aplicaciones',
    imagen_portada: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 2400, // 40 horas
    nivel_dificultad: 'basico',
    estado: 'activo',
  },
  '3': {
    id_curso: 3,
    titulo: 'Inteligencia Artificial',
    descripcion: 'Introducción a machine learning y redes neuronales',
    imagen_portada: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 3600, // 60 horas
    nivel_dificultad: 'avanzado',
    estado: 'activo',
  },
};

interface CourseDetailProps {
  courseId: string;
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const router = useRouter();
  const course = courseData[courseId];

  if (!course) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Curso no encontrado
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/courses')}
          sx={{ mt: 2 }}
        >
          Volver a Cursos
        </Button>
      </Box>
    );
  }

  const handleBackClick = () => {
    router.push('/courses');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours} horas`;
  };

  return (
    <Box>
      {/* Header con botón de regreso */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBackClick} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Volver a Cursos
        </Typography>
      </Box>

      {/* Información del curso */}
      <Box sx={{ display: 'flex', gap: 4, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        <Card sx={{ width: { xs: '100%', md: 400 }, flexShrink: 0 }}>
          <CardMedia
            component="img"
            height="200"
            image={course.imagen_portada}
            alt={course.titulo}
            sx={{ backgroundColor: 'grey.200' }}
          />
        </Card>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            {course.titulo}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {course.descripcion}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Duración:</strong> {formatDuration(course.duracion_estimada)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Nivel:</strong> {course.nivel_dificultad}
          </Typography>
        </Box>
      </Box>

      {/* Contenido del curso */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
        Contenido del Curso
      </Typography>

      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          El contenido del curso se mostrará aquí
        </Typography>
      </Box>
    </Box>
  );
}