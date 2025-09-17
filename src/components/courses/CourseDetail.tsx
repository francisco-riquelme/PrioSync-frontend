'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  PlayCircle as PlayCircleIcon,
} from '@mui/icons-material';

interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
}

interface CourseData {
  id_curso: number;
  titulo: string;
  descripcion: string;
  imagen_portada: string;
  duracion_estimada: number;
  nivel_dificultad: 'basico' | 'intermedio' | 'avanzado';
  estado: 'activo' | 'inactivo';
  modules: CourseModule[];
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
    modules: [
      {
        id: 'derivadas',
        title: 'Módulo 1: Derivadas',
        lessons: [
          { id: 'intro-derivadas', title: 'Introducción a Derivadas', duration: '25 min', completed: true },
          { id: 'regla-cadena', title: 'Regla de la Cadena', duration: '35 min', completed: false },
          { id: 'aplicaciones', title: 'Aplicaciones', duration: '40 min', completed: false },
        ]
      },
      {
        id: 'integrales',
        title: 'Módulo 2: Integrales',
        lessons: [
          { id: 'integrales-definidas', title: 'Integrales Definidas', duration: '30 min', completed: false },
          { id: 'tecnicas-integracion', title: 'Técnicas de Integración', duration: '50 min', completed: false },
        ]
      }
    ]
  },
  '2': {
    id_curso: 2,
    titulo: 'Desarrollo de Software',
    descripcion: 'Fundamentos de programación y desarrollo de aplicaciones',
    imagen_portada: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 2400, // 40 horas
    nivel_dificultad: 'basico',
    estado: 'activo',
    modules: [
      {
        id: 'fundamentos',
        title: 'Módulo 1: Fundamentos',
        lessons: [
          { id: 'intro-programacion', title: 'Introducción a la Programación', duration: '30 min', completed: false },
          { id: 'estructuras-datos', title: 'Estructuras de Datos', duration: '45 min', completed: false },
        ]
      }
    ]
  },
  '3': {
    id_curso: 3,
    titulo: 'Inteligencia Artificial',
    descripcion: 'Introducción a machine learning y redes neuronales',
    imagen_portada: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 3600, // 60 horas
    nivel_dificultad: 'avanzado',
    estado: 'activo',
    modules: [
      {
        id: 'intro-ia',
        title: 'Módulo 1: Introducción a IA',
        lessons: [
          { id: 'conceptos-basicos', title: 'Conceptos Básicos', duration: '20 min', completed: false },
          { id: 'machine-learning', title: 'Machine Learning', duration: '40 min', completed: false },
        ]
      }
    ]
  },
};

interface CourseDetailProps {
  courseId: string;
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const router = useRouter();
  const [expandedModule, setExpandedModule] = useState<string>('');
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

  const toggleModule = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? '' : moduleId);
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

      {course.modules.map((module) => (
        <Card key={module.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer',
                mb: expandedModule === module.id ? 2 : 0
              }}
              onClick={() => toggleModule(module.id)}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {module.title}
              </Typography>
              <IconButton>
                <PlayCircleIcon />
              </IconButton>
            </Box>

            {expandedModule === module.id && (
              <>
                <Divider sx={{ mb: 2 }} />
                <List disablePadding>
                  {module.lessons.map((lesson) => (
                    <ListItem 
                      key={lesson.id}
                      sx={{ 
                        pl: 0,
                        '&:hover': { backgroundColor: 'action.hover' },
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemIcon>
                        <CheckCircleIcon 
                          color={lesson.completed ? 'success' : 'disabled'} 
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={lesson.title}
                        secondary={lesson.duration}
                        sx={{
                          '& .MuiListItemText-primary': {
                            textDecoration: lesson.completed ? 'line-through' : 'none',
                            color: lesson.completed ? 'text.secondary' : 'text.primary'
                          }
                        }}
                      />
                      {!lesson.completed && (
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ textTransform: 'none' }}
                        >
                          Iniciar
                        </Button>
                      )}
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}