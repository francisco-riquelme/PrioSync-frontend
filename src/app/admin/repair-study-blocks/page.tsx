/**
 * Herramienta administrativa para reparar bloques de estudio
 * 
 * Agregar esta ruta temporalmente para reparar usuarios existentes:
 * /admin/repair-study-blocks
 */

'use client';

import React, { useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, Paper, List, ListItem, ListItemText } from '@mui/material';
import { useUser } from '@/contexts/UserContext';
import { getUserStudyBlocks, deleteStudyBlock, createStudyBlocks } from '@/utils/services/studyBlocks';
import type { DaySchedule } from '@/types/studySession';

interface RepairLog {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export default function RepairStudyBlocksPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<RepairLog[]>([]);
  const [repairComplete, setRepairComplete] = useState(false);

  const addLog = (level: RepairLog['level'], message: string) => {
    const log: RepairLog = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [...prev, log]);
    console.log(`[${level.toUpperCase()}] ${message}`);
  };

  const repairUserBlocks = async () => {
    if (!user?.usuarioId) {
      addLog('error', 'No hay usuario autenticado');
      return;
    }

    setLoading(true);
    setLogs([]);
    setRepairComplete(false);

    try {
      addLog('info', `Iniciando reparación para usuario: ${user.usuarioId}`);

      // Paso 1: Obtener bloques actuales
      addLog('info', 'Paso 1: Consultando bloques actuales...');
      const currentBlocks = await getUserStudyBlocks(user.usuarioId);
      addLog('success', `Encontrados ${currentBlocks.length} bloques en BD`);

      // Paso 2: Identificar bloques con dia_semana undefined
      const undefinedBlocks = currentBlocks.filter(block => !block.dia_semana || block.dia_semana === 'undefined');
      
      if (undefinedBlocks.length === 0) {
        addLog('success', '✅ No hay bloques con dia_semana undefined. Todo está correcto.');
        setRepairComplete(true);
        setLoading(false);
        return;
      }

      addLog('warning', `Encontrados ${undefinedBlocks.length} bloques con dia_semana undefined`);

      // Paso 3: Verificar localStorage
      addLog('info', 'Paso 2: Verificando datos en localStorage...');
      const welcomeData = localStorage.getItem('welcomeFormData');
      
      if (!welcomeData) {
        addLog('error', 'No hay datos en localStorage para restaurar');
        addLog('info', 'Solución: El usuario debe configurar sus horarios nuevamente desde /study-hours');
        setLoading(false);
        return;
      }

      const localData = JSON.parse(welcomeData);
      const tiempoDisponible: DaySchedule[] = localData.tiempoDisponible || [];

      if (tiempoDisponible.length === 0) {
        addLog('error', 'localStorage no contiene horarios válidos');
        setLoading(false);
        return;
      }

      addLog('success', `Encontrados ${tiempoDisponible.length} días con horarios en localStorage`);

      // Mostrar resumen de datos locales
      tiempoDisponible.forEach(day => {
        addLog('info', `  📅 ${day.day}: ${day.timeSlots.length} slots`);
      });

      // Paso 4: Eliminar bloques con undefined
      addLog('info', 'Paso 3: Eliminando bloques con dia_semana undefined...');
      
      const deletePromises = undefinedBlocks.map(block => 
        deleteStudyBlock(block.bloqueEstudioId)
      );
      
      await Promise.all(deletePromises);
      addLog('success', `✅ Eliminados ${undefinedBlocks.length} bloques incorrectos`);

      // Paso 5: Recrear bloques desde localStorage
      addLog('info', 'Paso 4: Recreando bloques con dia_semana correcto...');
      
      const success = await createStudyBlocks(user.usuarioId, tiempoDisponible);
      
      if (success) {
        addLog('success', '✅ Bloques recreados exitosamente con dia_semana correcto');
        addLog('success', '🎉 Reparación completada. Recarga la página para ver los cambios.');
        setRepairComplete(true);
        
        // Limpiar localStorage después de migración exitosa
        localStorage.removeItem('welcomeFormData');
        addLog('info', 'localStorage limpiado después de migración exitosa');
      } else {
        addLog('error', '❌ Error al recrear bloques. Revisa los logs de consola.');
      }

    } catch (error) {
      addLog('error', `Error durante reparación: ${error}`);
      console.error('Error completo:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLogColor = (level: RepairLog['level']) => {
    switch (level) {
      case 'error': return 'error.main';
      case 'warning': return 'warning.main';
      case 'success': return 'success.main';
      default: return 'text.primary';
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🔧 Reparación de Bloques de Estudio
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Esta herramienta repara bloques de estudio que tienen <code>dia_semana: undefined</code> en la base de datos.
        <br />
        <strong>Usuario actual:</strong> {user?.usuarioId || 'No autenticado'}
      </Alert>

      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={repairUserBlocks}
        disabled={loading || !user?.usuarioId}
        sx={{ mb: 3 }}
      >
        {loading ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Reparando...
          </>
        ) : (
          '🔨 Iniciar Reparación'
        )}
      </Button>

      {repairComplete && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ Reparación completada exitosamente. 
          <Button 
            variant="outlined" 
            size="small" 
            sx={{ ml: 2 }}
            onClick={() => window.location.reload()}
          >
            Recargar Página
          </Button>
        </Alert>
      )}

      {logs.length > 0 && (
        <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#fff', maxHeight: 500, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
            📋 Logs de Reparación
          </Typography>
          <List dense>
            {logs.map((log, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ 
                        fontFamily: 'monospace',
                        color: getLogColor(log.level)
                      }}
                    >
                      [{log.timestamp}] {log.message}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          📖 ¿Cómo funciona?
        </Typography>
        <Typography variant="body2" paragraph>
          1. Consulta todos los bloques de estudio del usuario actual en DynamoDB
        </Typography>
        <Typography variant="body2" paragraph>
          2. Identifica bloques con <code>dia_semana: undefined</code>
        </Typography>
        <Typography variant="body2" paragraph>
          3. Lee los datos correctos desde <code>localStorage.welcomeFormData</code>
        </Typography>
        <Typography variant="body2" paragraph>
          4. Elimina los bloques incorrectos de DynamoDB
        </Typography>
        <Typography variant="body2" paragraph>
          5. Crea nuevos bloques con <code>dia_semana</code> correctamente asignado
        </Typography>
        <Typography variant="body2" color="warning.main">
          ⚠️ Nota: Si no hay datos en localStorage, el usuario deberá configurar sus horarios manualmente desde /study-hours
        </Typography>
      </Box>
    </Box>
  );
}
