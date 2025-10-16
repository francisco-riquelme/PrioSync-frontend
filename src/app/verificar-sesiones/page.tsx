'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useUser } from '@/contexts/UserContext';
import { useStudySessions } from '@/components/courses/hooks/useStudySessions';

const VerificarSesiones: React.FC = () => {
  const { userData } = useUser();
  const { sessions, loading, error } = useStudySessions(userData?.usuarioId);

  console.log('🔍 DEBUG - Verificación de Sesiones');
  console.log('Usuario ID:', userData?.usuarioId);
  console.log('Total sesiones cargadas:', sessions.length);
  console.log('Sesiones completas:', sessions);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error al cargar sesiones: {error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          🔍 Verificación de Sesiones en Base de Datos
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Usuario actual:</strong> {userData?.nombre} {userData?.apellido} (ID: {userData?.usuarioId})
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Total de sesiones guardadas:</strong> {sessions.length}
          </Typography>
        </Alert>

        {sessions.length === 0 ? (
          <Alert severity="warning">
            No se encontraron sesiones guardadas en la base de datos para este usuario.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>ID Sesión</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Fecha</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Hora Inicio</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Hora Fin</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Duración</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tipo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Creado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.sesionEstudioId} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {session.sesionEstudioId?.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {new Date(session.fecha).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={session.hora_inicio} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={session.hora_fin} size="small" color="secondary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {session.duracion_minutos} min
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={session.tipo} 
                        size="small" 
                        color={session.tipo === 'estudio' ? 'info' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={session.estado} 
                        size="small" 
                        color={
                          session.estado === 'programada' ? 'warning' :
                          session.estado === 'completada' ? 'success' :
                          'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {session.createdAt ? new Date(session.createdAt).toLocaleString('es-ES') : 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default VerificarSesiones;
