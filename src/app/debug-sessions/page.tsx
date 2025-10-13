'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useUser } from '@/contexts/UserContext';
import { useStudySessions } from '@/components/courses/hooks/useStudySessions';

/**
 * Página de debug para verificar que las sesiones se guardan correctamente en la BD
 */
const DebugSessionsPage: React.FC = () => {
  const { userData } = useUser();
  const { sessions, loading, error, refreshSessions } = useStudySessions({ usuarioId: userData?.usuarioId });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    console.log('🔍 DEBUG - Sesiones cargadas desde BD:', sessions);
    console.log('🔍 DEBUG - Total de sesiones:', sessions.length);
    console.log('🔍 DEBUG - Usuario ID:', userData?.usuarioId);
  }, [sessions, userData]);

  const handleRefresh = async () => {
    console.log('🔄 Refrescando datos desde BD...');
    await refreshSessions();
    setLastRefresh(new Date());
    console.log('✅ Datos refrescados');
  };

  const getEstadoColor = (estado?: string | null) => {
    switch (estado) {
      case 'programada':
        return 'info';
      case 'completada':
        return 'success';
      case 'cancelada':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTipoIcon = (tipo?: string | null) => {
    switch (tipo) {
      case 'estudio':
        return '📚';
      case 'repaso':
        return '🔄';
      case 'examen':
        return '📝';
      default:
        return '📅';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon fontSize="large" color="primary" />
              Verificación de Base de Datos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Verifica que las sesiones de estudio se guardan correctamente en la BD
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refrescar
          </Button>
        </Box>

        {/* Información del usuario */}
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Alert severity="info" icon={<CheckIcon />}>
            <Typography variant="body2">
              <strong>Usuario:</strong> {userData?.nombre} {userData?.apellido} ({userData?.usuarioId})
            </Typography>
            <Typography variant="body2">
              <strong>Última actualización:</strong> {lastRefresh.toLocaleString('es-ES')}
            </Typography>
          </Alert>

          {error && (
            <Alert severity="error" icon={<ErrorIcon />}>
              <Typography variant="body2">
                <strong>Error al cargar:</strong> {error}
              </Typography>
            </Alert>
          )}

          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              📊 Estadísticas
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Total de Sesiones</Typography>
                <Typography variant="h4" color="primary.main">{sessions.length}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Programadas</Typography>
                <Typography variant="h4" color="info.main">
                  {sessions.filter(s => s.estado === 'programada').length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Completadas</Typography>
                <Typography variant="h4" color="success.main">
                  {sessions.filter(s => s.estado === 'completada').length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Canceladas</Typography>
                <Typography variant="h4" color="error.main">
                  {sessions.filter(s => s.estado === 'cancelada').length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Stack>

        {/* Tabla de sesiones */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : sessions.length === 0 ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <Typography variant="body1">
              No hay sesiones guardadas en la base de datos.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Ve al <strong>Calendario</strong> y crea una sesión para verificar que se guarda correctamente.
            </Typography>
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>ID Sesión</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Hora Inicio</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Hora Fin</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Duración</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Usuario ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Creado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session, index) => (
                  <TableRow 
                    key={session.sesionEstudioId || index}
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      bgcolor: index % 2 === 0 ? 'background.paper' : 'background.default'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                        {session.sesionEstudioId?.slice(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(session.fecha).toLocaleDateString('es-ES')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={session.hora_inicio} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={session.hora_fin} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {session.duracion_minutos} min
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span>{getTipoIcon(session.tipo)}</span>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {session.tipo || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={session.estado || 'N/A'} 
                        size="small" 
                        color={getEstadoColor(session.estado)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontSize="0.7rem">
                        {session.usuarioId?.slice(0, 12)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {session.createdAt 
                          ? new Date(session.createdAt).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Instrucciones */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'info.lighter', borderRadius: 2, border: '1px solid', borderColor: 'info.main' }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'info.main' }}>
            💡 Cómo verificar que se guardan en BD:
          </Typography>
          <Typography variant="body2" component="div" sx={{ color: 'info.dark' }}>
            <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Ve a la página de <strong>Calendario</strong></li>
              <li>Crea una nueva sesión de estudio seleccionando una fecha y hora</li>
              <li>Abre la <strong>Consola del navegador</strong> (F12) y busca los mensajes:
                <ul style={{ marginTop: '0.5rem' }}>
                  <li>📝 Guardando nueva sesión en BD: [datos]</li>
                  <li>✅ Sesión guardada exitosamente en BD: [resultado]</li>
                </ul>
              </li>
              <li>Vuelve a esta página y haz clic en <strong>Refrescar</strong></li>
              <li>Verifica que aparece la nueva sesión en la tabla</li>
              <li><strong>Recarga la página completa</strong> (Ctrl+R) para confirmar que los datos persisten</li>
            </ol>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DebugSessionsPage;
