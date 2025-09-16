'use client';

import React, { useState } from 'react';
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
}

// TODO: Backend Integration - Reemplazar con llamada a API para obtener cursos
// GET /api/courses - Obtener lista de cursos activos
const allCourses: Course[] = [
  {
    id_curso: 1,
    titulo: 'Cálculo Avanzado',
    descripcion: 'Curso completo de cálculo diferencial e integral',
    imagen_portada: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 1800, // 30 horas
    nivel_dificultad: 'intermedio',
    estado: 'activo',
  },
  {
    id_curso: 2,
    titulo: 'Desarrollo de Software',
    descripcion: 'Fundamentos de programación y desarrollo de aplicaciones',
    imagen_portada: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 2400, // 40 horas
    nivel_dificultad: 'basico',
    estado: 'activo',
  },
  {
    id_curso: 3,
    titulo: 'Inteligencia Artificial',
    descripcion: 'Introducción a machine learning y redes neuronales',
    imagen_portada: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 3600, // 60 horas
    nivel_dificultad: 'avanzado',
    estado: 'activo',
  },
  {
    id_curso: 4,
    titulo: 'Gestión de Proyectos',
    descripcion: 'Metodologías ágiles y gestión efectiva de proyectos',
    imagen_portada: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 1200, // 20 horas
    nivel_dificultad: 'basico',
    estado: 'activo',
  },
  {
    id_curso: 5,
    titulo: 'Diseño de UX/UI',
    descripcion: 'Principios de diseño centrado en el usuario',
    imagen_portada: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 1800, // 30 horas
    nivel_dificultad: 'intermedio',
    estado: 'activo',
  },
];

export default function CoursesList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('todos');
  const [durationFilter, setDurationFilter] = useState('todos');

  // TODO: Backend Integration - Implementar hook para obtener cursos desde API
  // const { courses, loading, error } = useCourses();
  
  // Filtrar solo cursos activos
  const activeCourses = allCourses.filter(course => course.estado === 'activo');

  // TODO: Backend Integration - Implementar búsqueda en el servidor
  // La búsqueda debería enviarse como query parameter: GET /api/courses?search=term
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

  const CourseCard = ({ course }: { course: Course }) => (
    <Card 
      sx={{ 
        cursor: 'pointer',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
        transition: 'all 0.2s ease-in-out',
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
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
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
        
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {course.titulo}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {course.descripcion}
        </Typography>

        <Button
          variant="contained"
          fullWidth
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

      {/* TODO: Backend Integration - Agregar estados de loading y error */}
      {/* {loading && <CircularProgress />} */}
      {/* {error && <Alert severity="error">Error al cargar cursos</Alert>} */}

      {/* Lista de Cursos */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 3
        }}
      >
        {filteredCourses.map((course) => (
          <CourseCard key={course.id_curso} course={course} />
        ))}
      </Box>

      {/* Mensaje cuando no hay resultados */}
      {filteredCourses.length === 0 && (searchTerm || levelFilter !== 'todos' || durationFilter !== 'todos') && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron cursos que coincidan con tus filtros
          </Typography>
        </Box>
      )}

      {/* TODO: Backend Integration - Manejar caso cuando no hay cursos */}
      {/* {activeCourses.length === 0 && !loading && (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          No hay cursos disponibles en este momento
        </Typography>
      )} */}
    </Box>
  );
}