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
import { useCourseFilters } from '@/components/courses/hooks/useCourseFilters';
import { CourseCard } from './CourseCard';
import { useCourse } from '@/components/courses/hooks/useCourse';

export default function CoursesList() {
  const router = useRouter();
  
  // Use custom hook for filter controls
  const { filters, actions } = useCourseFilters();
  
  // Use unified course hook to fetch all courses
  const { courses, loading, error } = useCourse();

  const handleCourseClick = (courseId: number | string) => {
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
                  key={course.cursoId} 
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