'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
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
import { useCoursesListData } from '@/components/courses/hooks/useCoursesListData';
import { CourseCard } from './CourseCard';

export default function CoursesList() {
  const router = useRouter();
  
  // Use new hook for courses data
  const { courses, loading, error } = useCoursesListData();
  
  // Local filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('todos');
  const [durationFilter, setDurationFilter] = useState('todos');

  // Apply filters to courses
  const filteredCourses = useMemo(() => {
    let filtered = [...courses];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        course.titulo.toLowerCase().includes(searchLower) ||
        course.descripcion?.toLowerCase().includes(searchLower) ||
        course.playlistTitle?.toLowerCase().includes(searchLower)
      );
    }

    // Apply level filter
    if (levelFilter !== 'todos') {
      filtered = filtered.filter(course => course.nivel_dificultad === levelFilter);
    }

    // Apply duration filter
    if (durationFilter !== 'todos') {
      filtered = filtered.filter(course => {
        const duration = course.duracion_estimada || 0;
        switch (durationFilter) {
          case 'corto':
            return duration <= 30;
          case 'medio':
            return duration > 30 && duration <= 120;
          case 'largo':
            return duration > 120;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [courses, searchTerm, levelFilter, durationFilter]);

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
          {filteredCourses.length > 0 ? (
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 3
              }}
            >
              {filteredCourses.map((course) => (
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