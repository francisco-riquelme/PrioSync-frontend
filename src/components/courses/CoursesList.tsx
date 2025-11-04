'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
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
  Button,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useUser } from '@/contexts/UserContext';
import { useCursosConProgreso } from '@/hooks/useCursosConProgreso';
import { CourseCard } from './CourseCard';
import { useCoursesListData } from './hooks/useCoursesListData';

export default function CoursesList() {
  const router = useRouter();
  
  // Get user data
  const { userData } = useUser();
  
  // Get courses with progress
  const { cursos: cursosConProgreso } = useCursosConProgreso();
  
  // Local filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('todos');
  const [durationFilter, setDurationFilter] = useState('todos');

  // Debounce search term to avoid too many backend queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Create a map for quick progress lookup
  const progresoMap = useMemo(() => {
    const map = new Map<string, number>();
    cursosConProgreso.forEach(curso => {
      map.set(curso.cursoId, curso.progreso);
    });
    return map;
  }, [cursosConProgreso]);

  // Use optimized hook with filters
  const { courses, loading, error } = useCoursesListData({
    searchTerm: debouncedSearchTerm,
    levelFilter,
    durationFilter,
    usuarioId: userData?.usuarioId,
  });

  const handleCourseClick = (courseId: number | string) => {
    router.push(`/courses/${courseId}`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setLevelFilter('todos');
    setDurationFilter('todos');
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

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
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
            <MenuItem value="corto">Corto (&lt;30h)</MenuItem>
            <MenuItem value="medio">Medio (30-120h)</MenuItem>
            <MenuItem value="largo">Largo (&gt;120h)</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={handleClearFilters}
          sx={{ minWidth: 120 }}
        >
          Limpiar
        </Button>
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
                  progreso={progresoMap.get(course.cursoId)}
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No se encontraron cursos con los filtros aplicados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Intenta ajustar los filtros o limpiar la búsqueda
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}