'use client';

import React from 'react';
import NextLink from 'next/link';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Link,
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useLecciones } from './hooks/useLecciones';
import { getLessonTypeIcon, getMaterialTypeColor, formatDuration } from './courseUtils';

interface CourseLessonsProps {
  courseId: string;
}

export default function CourseLessons({ courseId }: CourseLessonsProps) {
  const { lecciones, loading, error, refetch } = useLecciones(courseId);

  // Loading state
  if (loading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
          Lecciones del Curso
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
          Lecciones del Curso
        </Typography>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
        Lecciones del Curso
      </Typography>

      {lecciones.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Orden</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Duración</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lecciones.map((leccion) => (
                <TableRow 
                  key={leccion.leccionId}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'action.hover',
                      cursor: 'pointer' 
                    } 
                  }}
                >
                  <TableCell>
                    <Chip
                      label={leccion.orden || '-'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      component={NextLink}
                      href={`/courses/lecciones/${leccion.leccionId}`}
                      underline="hover"
                      sx={{ 
                        fontWeight: 500,
                        color: 'primary.main',
                        '&:hover': {
                          color: 'primary.dark'
                        }
                      }}
                    >
                      {leccion.titulo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                      {leccion.descripcion || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getLessonTypeIcon(leccion.tipo)}
                      <Chip
                        label={leccion.tipo || 'N/A'}
                        size="small"
                        color={getMaterialTypeColor(leccion.tipo)}
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {formatDuration(leccion.duracion_minutos)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <IconButton
                        component={NextLink}
                        href={`/courses/lecciones/${leccion.leccionId}`}
                        size="small"
                        color="primary"
                        title="Ver lección"
                      >
                        <ArrowForwardIcon />
                      </IconButton>
                      {leccion.url_contenido && (
                        <IconButton
                          component="a"
                          href={leccion.url_contenido}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          color="secondary"
                          title="Abrir contenido en nueva pestaña"
                        >
                          <OpenInNewIcon />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No hay lecciones disponibles para este curso.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
