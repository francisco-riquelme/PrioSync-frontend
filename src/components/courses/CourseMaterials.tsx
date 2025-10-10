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
  IconButton,
  Link,
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { getMaterialTypeIcon, getMaterialTypeColor, getMaterialTypeLabel } from './courseUtils';
import type { MaterialFromCourse } from './hooks/useCourseDetailData';

interface CourseMaterialsProps {
  materiales: MaterialFromCourse[];
  loading: boolean;
}

export default function CourseMaterials({ materiales, loading }: CourseMaterialsProps) {
  // Loading state
  if (loading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
          Material de Estudio
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
        Material de Estudio
      </Typography>

      {materiales.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Orden</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materiales.map((material) => (
                <TableRow 
                  key={material.materialEstudioId}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'action.hover',
                      cursor: 'pointer' 
                    } 
                  }}
                >
                  <TableCell>
                    <Chip
                      label={material.orden || '-'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      component={NextLink}
                      href={`/courses/material/${material.materialEstudioId}`}
                      underline="hover"
                      sx={{ 
                        fontWeight: 500,
                        color: 'primary.main',
                        '&:hover': {
                          color: 'primary.dark'
                        }
                      }}
                    >
                      {material.titulo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                      {material.descripcion || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getMaterialTypeIcon(material.tipo)}
                      <Chip
                        label={getMaterialTypeLabel(material.tipo)}
                        size="small"
                        color={getMaterialTypeColor(material.tipo)}
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <IconButton
                        component={NextLink}
                        href={`/courses/material/${material.materialEstudioId}`}
                        size="small"
                        color="primary"
                        title="Ver material"
                      >
                        <ArrowForwardIcon />
                      </IconButton>
                      {material.url_contenido && (
                        <IconButton
                          component="a"
                          href={material.url_contenido}
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
              No hay materiales de estudio disponibles para este curso.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
