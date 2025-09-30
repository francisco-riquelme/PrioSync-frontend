'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  PlayCircle as PlayCircleIcon,
  Feedback as FeedbackIcon,
  Description as DescriptionIcon,
  Quiz as QuizIcon,
  Download as DownloadIcon,
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
  description?: string;
  videoUrl?: string;
  materials?: LessonMaterial[];
}

interface LessonMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'quiz' | 'video' | 'document';
  url?: string;
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
  progress?: number;
}

// Datos de ejemplo - TODO: Backend Integration
const courseData: Record<string, CourseData> = {
  '1': {
    id_curso: 1,
    titulo: 'Cálculo Avanzado',
    descripcion: 'Curso completo de cálculo diferencial e integral',
    imagen_portada: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 1800,
    nivel_dificultad: 'intermedio',
    estado: 'activo',
    modules: [
      {
        id: 'derivadas',
        title: 'Módulo 1: Derivadas',
        lessons: [
          { 
            id: 'intro-derivadas', 
            title: 'Introducción a Derivadas', 
            duration: '25 min', 
            completed: true,
            description: 'Una introducción a los conceptos básicos de las derivadas, su significado geométrico y sus primeras aplicaciones.',
            videoUrl: 'https://example.com/video1',
            materials: [
              { id: 'notes1', title: 'Apuntes de la lección (PDF)', type: 'pdf' },
              { id: 'exercises1', title: 'Ejercicios Resueltos (PDF)', type: 'pdf' },
              { id: 'quiz1', title: 'Cuestionario de práctica', type: 'quiz' }
            ]
          },
          { 
            id: 'regla-cadena', 
            title: 'Regla de la Cadena', 
            duration: '35 min', 
            completed: false,
            description: 'Aprende a aplicar la regla de la cadena para derivar funciones compuestas.',
            videoUrl: 'https://example.com/video2',
            materials: [
              { id: 'notes2', title: 'Apuntes de la lección (PDF)', type: 'pdf' },
              { id: 'exercises2', title: 'Ejercicios Resueltos (PDF)', type: 'pdf' }
            ]
          },
          { 
            id: 'aplicaciones', 
            title: 'Aplicaciones de Derivadas', 
            duration: '40 min', 
            completed: false,
            description: 'Explora las aplicaciones prácticas de las derivadas en problemas reales.',
            videoUrl: 'https://example.com/video3',
            materials: [
              { id: 'notes3', title: 'Apuntes de la lección (PDF)', type: 'pdf' },
              { id: 'quiz3', title: 'Cuestionario de práctica', type: 'quiz' }
            ]
          },
        ]
      },
      {
        id: 'integrales',
        title: 'Módulo 2: Integrales',
        lessons: [
          { 
            id: 'integrales-definidas', 
            title: 'Integrales Definidas', 
            duration: '30 min', 
            completed: false,
            description: 'Conceptos fundamentales de las integrales definidas y su interpretación geométrica.',
            videoUrl: 'https://example.com/video4',
            materials: [
              { id: 'notes4', title: 'Apuntes de la lección (PDF)', type: 'pdf' },
              { id: 'exercises4', title: 'Ejercicios Resueltos (PDF)', type: 'pdf' }
            ]
          },
          { 
            id: 'tecnicas-integracion', 
            title: 'Técnicas de Integración', 
            duration: '50 min', 
            completed: false,
            description: 'Diferentes métodos y técnicas para resolver integrales complejas.',
            videoUrl: 'https://example.com/video5',
            materials: [
              { id: 'notes5', title: 'Apuntes de la lección (PDF)', type: 'pdf' },
              { id: 'quiz5', title: 'Cuestionario de práctica', type: 'quiz' }
            ]
          },
        ]
      }
    ]
  },
  '2': {
    id_curso: 2,
    titulo: 'Desarrollo de Software',
    descripcion: 'Fundamentos de programación y desarrollo de aplicaciones',
    imagen_portada: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 2400,
    nivel_dificultad: 'basico',
    estado: 'activo',
    modules: [
      {
        id: 'fundamentos',
        title: 'Módulo 1: Fundamentos',
        lessons: [
          { 
            id: 'intro-programacion', 
            title: 'Introducción a la Programación', 
            duration: '30 min', 
            completed: false,
            description: 'Conceptos básicos de programación y algoritmos.',
            videoUrl: 'https://example.com/video6',
            materials: [
              { id: 'notes6', title: 'Apuntes de la lección (PDF)', type: 'pdf' },
              { id: 'quiz6', title: 'Cuestionario de práctica', type: 'quiz' }
            ]
          },
          { 
            id: 'estructuras-datos', 
            title: 'Estructuras de Datos', 
            duration: '45 min', 
            completed: false,
            description: 'Arrays, listas, pilas y colas en programación.',
            videoUrl: 'https://example.com/video7',
            materials: [
              { id: 'notes7', title: 'Apuntes de la lección (PDF)', type: 'pdf' },
              { id: 'exercises7', title: 'Ejercicios Prácticos (PDF)', type: 'pdf' }
            ]
          },
        ]
      }
    ]
  },
};

interface LessonDetailProps {
  courseId: string;
  lessonId: string;
}

export default function LessonDetail({ courseId, lessonId }: LessonDetailProps) {
  const router = useRouter();
  const [lesson, setLesson] = useState<CourseLesson | null>(null);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [currentModule, setCurrentModule] = useState<CourseModule | null>(null);
  const [lessonNumber, setLessonNumber] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const loadLessonData = () => {
      try {
        setLoading(true);
        
        const course = courseData[courseId];
        if (!course) {
          throw new Error('Curso no encontrado');
        }

        setCourse(course);

        // Buscar la lección en todos los módulos
        let foundLesson: CourseLesson | null = null;
        let foundModule: CourseModule | null = null;
        let lessonIndex = 0;

        for (const courseModule of course.modules) {
          const lessonIndexInModule = courseModule.lessons.findIndex((l: CourseLesson) => l.id === lessonId);
          if (lessonIndexInModule !== -1) {
            foundLesson = courseModule.lessons[lessonIndexInModule];
            foundModule = courseModule;
            lessonIndex = lessonIndexInModule + 1; // +1 para mostrar "Lección 1", "Lección 2", etc.
            break;
          }
        }

        if (!foundLesson || !foundModule) {
          throw new Error('Lección no encontrada');
        }

        setLesson(foundLesson);
        setCurrentModule(foundModule);
        setLessonNumber(lessonIndex);
        
      } catch (error) {
        console.error('Error loading lesson:', error);
        setMessage('Error al cargar la lección. Por favor, intenta nuevamente.');
        setMessageType('error');
        setShowMessage(true);
      } finally {
        setLoading(false);
      }
    };

    loadLessonData();
  }, [courseId, lessonId]);

  const handleBackClick = () => {
    router.push(`/courses/${courseId}`);
  };

  const handleCompleteLesson = async () => {
    try {
      // TODO: Backend Integration - Llamada a API para marcar lección como completada
      // await markLessonAsCompleted(courseId, lessonId);
      
      // Simulación
      if (lesson) {
        setLesson({ ...lesson, completed: true });
        setMessage('¡Lección completada exitosamente!');
        setMessageType('success');
        setShowMessage(true);
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      setMessage('Error al completar la lección. Por favor, intenta nuevamente.');
      setMessageType('error');
      setShowMessage(true);
    }
  };

  const handleMaterialClick = (material: LessonMaterial) => {
    // TODO: Backend Integration - Manejar descarga o apertura de material
    console.log('Opening material:', material);
    setMessage(`Abriendo ${material.title}...`);
    setMessageType('success');
    setShowMessage(true);
  };

  const handleFeedback = () => {
    // TODO: Backend Integration - Abrir modal de feedback
    setMessage('Funcionalidad de feedback próximamente disponible');
    setMessageType('success');
    setShowMessage(true);
  };

  const handleCloseMessage = () => {
    setShowMessage(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!lesson || !course || !currentModule) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Lección no encontrada
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleBackClick}
          sx={{ mt: 2 }}
        >
          Volver al Curso
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header con botón de regreso */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBackClick} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Volver al temario
        </Typography>
      </Box>

      {/* Información de la lección */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Lección {lessonNumber}: {lesson.title}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          {course.titulo}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Módulo: {currentModule.title} • Duración: {lesson.duration}
        </Typography>
      </Box>

      {/* Video Player Placeholder */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 0 }}>
          <Box
            sx={{
              height: 400,
              backgroundColor: 'grey.800',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              position: 'relative',
            }}
          >
            <IconButton
              sx={{
                color: 'white',
                fontSize: 60,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <PlayCircleIcon fontSize="inherit" />
            </IconButton>
            <Typography variant="body1" color="white" sx={{ mt: 2 }}>
              El video de la lección se reproduciría aquí.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Descripción */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
            Descripción
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {lesson.description}
          </Typography>
        </CardContent>
      </Card>

      {/* Material Complementario */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
            Material Complementario
          </Typography>
          <List disablePadding>
            <ListItem
              sx={{
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'action.hover' },
                borderRadius: 1,
                mb: 1,
              }}
              onClick={() => handleMaterialClick({ id: 'notes1', title: 'Apuntes de la lección (PDF)', type: 'pdf' })}
            >
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText
                primary="Apuntes de la lección (PDF)"
                sx={{
                  '& .MuiListItemText-primary': {
                    color: 'text.primary'
                  }
                }}
              />
            </ListItem>
            <Divider />
            <ListItem
              sx={{
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'action.hover' },
                borderRadius: 1,
                mb: 1,
              }}
              onClick={() => handleMaterialClick({ id: 'exercises1', title: 'Ejercicios Resueltos (PDF)', type: 'pdf' })}
            >
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText
                primary="Ejercicios Resueltos (PDF)"
                sx={{
                  '& .MuiListItemText-primary': {
                    color: 'text.primary'
                  }
                }}
              />
            </ListItem>
            <Divider />
            <ListItem
              sx={{
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'action.hover' },
                borderRadius: 1,
                mb: 1,
              }}
              onClick={() => handleMaterialClick({ id: 'quiz1', title: 'Cuestionario de práctica', type: 'quiz' })}
            >
              <ListItemIcon>
                <QuizIcon />
              </ListItemIcon>
              <ListItemText
                primary="Cuestionario de práctica"
                sx={{
                  '& .MuiListItemText-primary': {
                    color: 'text.primary'
                  }
                }}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Estado de la lección y acciones */}
      <Card>
        <CardContent>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: lesson.completed ? 'success.light' : 'grey.100',
              borderRadius: 1,
              p: 2,
              minHeight: 60
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {lesson.completed ? (
                <>
                  <CheckCircleIcon color="success" />
                  <Typography variant="body1" color="success.main" sx={{ fontWeight: 500 }}>
                    Lección completada
                  </Typography>
                </>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleCompleteLesson}
                  sx={{ textTransform: 'none' }}
                >
                  Marcar como completada
                </Button>
              )}
            </Box>
            
            <Button
              variant="text"
              startIcon={<FeedbackIcon />}
              onClick={handleFeedback}
              sx={{ textTransform: 'none' }}
            >
              Dar feedback
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={showMessage}
        autoHideDuration={6000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseMessage} 
          severity={messageType}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
