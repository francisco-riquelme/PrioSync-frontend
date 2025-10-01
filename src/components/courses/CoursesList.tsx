'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { getQueryFactories } from '@/utils/commons/queries';
import { MainTypes } from '@/utils/api/schema';
import { useCourseFilters } from '@/components/courses/hooks/useCourseFilters';
import { CourseCard } from './CourseCard';
import { Course } from '@/components/courses/hooks/useCourses';

export default function CoursesList() {
  const router = useRouter();
  
  // Use custom hook for filter controls
  const { filters, actions } = useCourseFilters();
  
  // Single source of truth para cursos
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load courses function
  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new query factories pattern
      const { Curso } = await getQueryFactories<MainTypes, "Curso">({
        entities: ["Curso"],
      });

      // Filter for active courses only
      const filter = { estado: { eq: 'activo' } };

      const res = await Curso.list({
        filter,
        followNextToken: true, // Get all results
        maxPages: 10 // Safety limit
      });
      
      // Transform the response to match the Course interface
      const coursesData: Course[] = res.items.map((curso: any) => ({
        id_curso: parseInt(curso.cursoId),
        titulo: curso.titulo,
        descripcion: curso.descripcion || '',
        imagen_portada: curso.imagen_portada || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop&auto=format',
        duracion_estimada: curso.duracion_estimada || 0,
        nivel_dificultad: curso.nivel_dificultad || 'basico',
        estado: curso.estado || 'activo',
      }));
      
      setCourses(coursesData);
      
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Error al cargar los cursos. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load courses on component mount
  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleCourseClick = (courseId: number) => {
    router.push(`/courses/${courseId}`);
  };

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

      {/* Filtros (non-functional UI) */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar cursos..."
          value={filters.searchTerm}
          onChange={(e) => actions.setSearchTerm(e.target.value)}
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
            value={filters.levelFilter}
            label="Nivel"
            onChange={(e) => actions.setLevelFilter(e.target.value)}
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
            value={filters.durationFilter}
            label="Duración"
            onChange={(e) => actions.setDurationFilter(e.target.value)}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="corto">Corto (&lt;20h)</MenuItem>
            <MenuItem value="medio">Medio (20-40h)</MenuItem>
            <MenuItem value="largo">Largo (&gt;40h)</MenuItem>
          </Select>
        </FormControl>
      </Box>

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
          {/* Lista de cursos */}
          {courses.length > 0 ? (
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 3
              }}
            >
              {courses.map((course) => (
                <CourseCard 
                  key={course.id_curso} 
                  course={course} 
                  onCourseClick={handleCourseClick}
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No hay cursos disponibles en este momento
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}