'use client';

import React, { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';


interface Course {
  id_curso: number;
  titulo: string;
  descripcion: string;
  imagen_portada: string;
  duracion_estimada: number; // en minutos
  nivel_dificultad: 'basico' | 'intermedio' | 'avanzado';
  estado: 'activo' | 'inactivo';
  // Campos adicionales para gestión de inscripción y progreso
  isEnrolled?: boolean;
  progress?: number;
}

// ✅ Backend Integration - Configuración actualizada
// const API_CONFIG = {
//   COURSES_LOAD_DELAY: 100, // ms para simular carga de cursos (solo para UX)
//   ENABLE_BACKEND_INTEGRATION: true, // flag principal para usar backend real
// } as const;

// ✅ Backend Integration - Función real para obtener cursos desde el backend
const getCourses = async (): Promise<Course[]> => {
  try {
    const response = await fetch('/api/courses');
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener cursos');
    }
    
    // Mapear datos del backend al formato esperado por el componente
    const coursesWithEnrollment = result.data.courses.map((course: Course) => ({
      ...course,
      // TODO: User Context Integration - Obtener estado de inscripción real del usuario
      isEnrolled: course.id_curso <= 2, // Simulación temporal
      progress: course.id_curso === 1 ? 65 : course.id_curso === 2 ? 20 : 0
    }));
    
    return coursesWithEnrollment;
  } catch (error) {
    console.error('Error al cargar cursos desde el backend:', error);
    throw error;
  }
};

export default function CoursesList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('todos');
  const [durationFilter, setDurationFilter] = useState('todos');
  
  // Single source of truth para cursos
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para gestión de inscripciones
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // TODO: User Context Integration - Reemplazar con useUser() hook
  // const { user, updateCourseProgress, addActivity } = useUser();
  
  // TODO: Backend Integration - Hooks especializados para diferentes operaciones
  // const { enrolledCourses, loading: enrolledLoading, error: enrolledError } = useEnrolledCourses();
  // const { availableCourses, loading: coursesLoading, error: coursesError } = useAvailableCourses();
  // const { enrollInCourse, loading: enrollLoading } = useEnrollCourse();

  // Cargar cursos al montar el componente
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const coursesData = await getCourses();
        setCourses(coursesData);
        
        // TODO: User Context Integration - Combinar con datos del usuario
        // const userCourses = user.courses || [];
        // const coursesWithProgress = coursesData.map(course => {
        //   const userCourse = userCourses.find(uc => uc.courseId === course.id_curso);
        //   return {
        //     ...course,
        //     isEnrolled: !!userCourse,
        //     progress: userCourse?.progress || 0,
        //   };
        // });
        // setCourses(coursesWithProgress);
        
      } catch (err) {
        console.error('Error loading courses:', err);
        setError('Error al cargar los cursos. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Filtrar solo cursos activos
  const activeCourses = courses.filter(course => course.estado === 'activo');

  // TODO: Backend Integration - Implementar filtros en el servidor
  // Los filtros deberían enviarse como query parameters: GET /api/courses?search=term&level=basico&duration=short
  const filteredCourses = activeCourses.filter(course => {
    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = course.titulo.toLowerCase().includes(searchLower) ||
                           course.descripcion.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Filtro de nivel
    if (levelFilter !== 'todos' && course.nivel_dificultad !== levelFilter) {
      return false;
    }

    // Filtro de duración
    if (durationFilter !== 'todos') {
      const hours = Math.floor(course.duracion_estimada / 60);
      if (durationFilter === 'corto' && hours > 20) return false;
      if (durationFilter === 'medio' && (hours <= 20 || hours > 40)) return false;
      if (durationFilter === 'largo' && hours <= 40) return false;
    }

    return true;
  });

  const handleCourseClick = (courseId: number) => {
    // TODO: Backend Integration - Verificar que la ruta coincida con el backend
    // Posiblemente necesite ajustar según la estructura de rutas del API
    router.push(`/courses/${courseId}`);
  };

  // ✅ Backend Integration - Función real para manejar inscripción
  const handleEnrollCourse = async (courseId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      setEnrollingCourseId(courseId);
      
      // Llamada real al API de inscripción
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1, // TODO: User Context Integration - Usar ID real del usuario
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Ya estás inscrito en este curso');
        }
        throw new Error(result.message || 'Error al inscribirse al curso');
      }
      
      // Actualizar estado local después de inscripción exitosa
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.id_curso === courseId
            ? { ...course, isEnrolled: true, progress: 0 }
            : course
        )
      );
      
      // TODO: User Context Integration - Actualizar contexto del usuario
      // const courseData = courses.find(c => c.id_curso === courseId);
      // if (courseData) {
      //   await updateCourseProgress(courseId, 0);
      //   await addActivity({
      //     type: 'course_enrolled',
      //     courseId: courseId,
      //     courseName: courseData.titulo,
      //     description: `Te inscribiste en el curso: ${courseData.titulo}`,
      //   });
      // }
      
      // Mostrar mensaje de éxito
      const courseName = courses.find(c => c.id_curso === courseId)?.titulo || 'Curso';
      setMessage(`¡Te has inscrito exitosamente en "${courseName}"!`);
      setMessageType('success');
      setShowMessage(true);
      
    } catch (error: unknown) {
      console.error('Error al inscribirse:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error de inscripción';
      
      // Manejo específico de errores del backend
      if (errorMessage.includes('Ya estás inscrito')) {
        setMessage('Ya estás inscrito en este curso.');
      } else {
        setMessage(errorMessage || 'Hubo un error al inscribirse. Por favor, intenta nuevamente.');
      }
      setMessageType('error');
      setShowMessage(true);
      
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleCloseMessage = () => {
    setShowMessage(false);
  };

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

  const CourseCard = ({ course, showEnrollButton = false }: { course: Course; showEnrollButton?: boolean }) => {
    const isEnrolling = enrollingCourseId === course.id_curso;
    
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
        onClick={() => handleCourseClick(course.id_curso)}
      >
        <CardMedia
          component="img"
          height="160"
          image={course.imagen_portada}
          alt={course.titulo}
          sx={{ backgroundColor: 'grey.200' }}
        />
        <CardContent 
          sx={{ 
            flexGrow: 1, 
            display: 'grid',
            gridTemplateRows: 'auto auto 1fr auto auto', // chips, título, descripción, progreso, botón
            gap: 1,
            alignContent: 'start',
          }}
        >
          {/* Chips de nivel y duración */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={course.nivel_dificultad} 
              size="small" 
              color={getLevelColor(course.nivel_dificultad)}
              variant="outlined"
            />
            <Chip 
              label={formatDuration(course.duracion_estimada)} 
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

          {/* Barra de progreso para cursos inscritos */}
          {course.isEnrolled && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Progreso
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {course.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={course.progress || 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: 'primary.main',
                  },
                }}
              />
            </Box>
          )}

          {/* Botón de acción */}
          <Button
            variant="contained"
            fullWidth
            onClick={showEnrollButton ? (e) => handleEnrollCourse(course.id_curso, e) : undefined}
            disabled={isEnrolling}
            sx={{
              textTransform: 'none',
              py: 1,
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&:disabled': {
                backgroundColor: 'grey.300',
              },
            }}
          >
            {isEnrolling ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                Inscribiendo...
              </Box>
            ) : showEnrollButton ? (
              'Inscribirse'
            ) : (
              'Continuar Aprendiendo'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Separar cursos matriculados y disponibles
  const myCourses = filteredCourses.filter(course => course.isEnrolled);
  const availableCourses = filteredCourses.filter(course => !course.isEnrolled);

  return (
    <Box>
      {/* Header */}
      <Typography 
        variant="h4" 
        sx={{ 
          fontWeight: 700, 
          mb: 3,
          color: 'text.primary'
        }}
      >
        Cursos
      </Typography>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar cursos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Nivel</InputLabel>
          <Select
            value={levelFilter}
            label="Nivel"
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="basico">Básico</MenuItem>
            <MenuItem value="intermedio">Intermedio</MenuItem>
            <MenuItem value="avanzado">Avanzado</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Duración</InputLabel>
          <Select
            value={durationFilter}
            label="Duración"
            onChange={(e) => setDurationFilter(e.target.value)}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="corto">Corto (&lt;20h)</MenuItem>
            <MenuItem value="medio">Medio (20-40h)</MenuItem>
            <MenuItem value="largo">Largo (&gt;40h)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* TODO: Backend Integration - Agregar estados de loading y error combinados */}
      {/* {(coursesLoading || enrolledLoading) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )} */}
      
      {/* {(coursesError || enrolledError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error al cargar cursos. Por favor, intenta nuevamente.
        </Alert>
      )} */}

      {/* Estados de loading y error */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Renderizar contenido solo si no hay loading ni error */}
      {!loading && !error && (
        <>
          {/* Mis Cursos */}
          {myCourses.length > 0 && (
            <Box sx={{ mb: 6 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                    fontWeight: 600, 
                    mb: 3,
                    color: 'text.secondary' 
                    }}
              >
                Mis Cursos
              </Typography>
              <Box 
                sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                  gap: 3
                }}
              >
                {myCourses.map((course) => (
                  <CourseCard key={course.id_curso} course={course} />
                ))}
              </Box>
            </Box>
          )}

          {/* Explorar Cursos */}
          {availableCourses.length > 0 && (
            <Box>
              <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600, 
                mb: 3, 
                color: 'text.secondary'
                }}
              >
                Explorar Cursos
              </Typography>
              <Box 
                sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                  gap: 3
                }}
              >
                {availableCourses.map((course) => (
                  <CourseCard key={course.id_curso} course={course} showEnrollButton />
                ))}
              </Box>
            </Box>
          )}

          {/* Mensaje cuando no hay resultados */}
          {filteredCourses.length === 0 && (searchTerm || levelFilter !== 'todos' || durationFilter !== 'todos') && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No se encontraron cursos que coincidan con tus filtros
              </Typography>
            </Box>
          )}

          {/* Mensaje cuando no hay cursos disponibles */}
          {courses.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No hay cursos disponibles en este momento
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* TODO: Backend Integration - Manejar estados de inscripción con loading overlay */}
      {enrollingCourseId && (
        <Backdrop open={!!enrollingCourseId} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress color="primary" size={60} />
            <Typography variant="h6" color="white">
              Procesando inscripción...
            </Typography>
          </Box>
        </Backdrop>
      )}

      {/* TODO: Backend Integration - Snackbar para mensajes de éxito/error */}
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