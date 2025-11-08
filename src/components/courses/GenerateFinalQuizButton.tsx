"use client";

import React, { useState } from 'react';
import { Box, Tooltip } from '@mui/material';
import { useCrearQuestionarioFinal } from "../quiz/hooks/useCrearQuestionarioFinal";
import { useProgresoCurso } from './hooks/useProgresoCurso';
import type { ModuloWithLecciones } from './hooks/useCourseDetailData';

interface GenerateFinalQuizButtonProps {
  cursoId: string;
  modulos: ModuloWithLecciones[];
  usuarioId: string;
  onSuccess?: () => void;
  onNotify?: (msg: string, severity?: 'success' | 'error' | 'info') => void;
}

export default function GenerateFinalQuizButton({
  cursoId,
  modulos,
  usuarioId,
  onSuccess,
  onNotify,
}: GenerateFinalQuizButtonProps) {
  const [loading, setLoading] = useState(false);
  const crearHook = useCrearQuestionarioFinal({ 
    onSuccess: () => {
      if (onNotify) {
        onNotify('Cuestionario final generado correctamente (20 preguntas de todos los módulos)', 'success');
      }
      if (onSuccess) {
        onSuccess();
      }
    }
  });
  const { progreso, leccionesCompletadas, totalLecciones, loading: progresoLoading } = useProgresoCurso({ modulos, usuarioId });

  const handleGenerate = async () => {
    try {
      setLoading(true);

      // Check if user has completed at least 70% of the course
      if (progreso < 70) {
        const message = `Debes completar al menos el 70% del curso para generar el cuestionario final. Progreso actual: ${progreso}% (${leccionesCompletadas}/${totalLecciones} lecciones)`;
        if (onNotify) onNotify(message, 'info');
        return;
      }

      await crearHook.crear(cursoId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Error generando cuestionario final:', message, err);
      if (onNotify) onNotify(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || progresoLoading || progreso < 70;

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleGenerate();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      handleGenerate();
    }
  };

  const tooltipTitle = progreso < 70 
    ? `Completa al menos el 70% del curso para generar el cuestionario final (${progreso}% actual - ${leccionesCompletadas}/${totalLecciones} lecciones)` 
    : 'Generar cuestionario final del curso (20 preguntas de todos los módulos)';

  return (
    <Tooltip title={tooltipTitle} arrow>
      <Box
        component="span"
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 24px',
          fontSize: '0.9375rem',
          fontWeight: 600,
          lineHeight: 1.75,
          borderRadius: '8px',
          textTransform: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          backgroundColor: isDisabled ? 'rgba(0, 0, 0, 0.12)' : 'rgb(46, 125, 50)',
          color: isDisabled ? 'rgba(0, 0, 0, 0.26)' : 'rgb(255, 255, 255)',
          boxShadow: isDisabled ? 'none' : '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
          transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
          '&:hover': {
            backgroundColor: isDisabled ? 'rgba(0, 0, 0, 0.12)' : 'rgb(27, 94, 32)',
            boxShadow: isDisabled ? 'none' : '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
            transform: isDisabled ? 'none' : 'translateY(-2px)',
          },
          '&:focus': {
            outline: 'none',
            boxShadow: isDisabled ? 'none' : '0px 0px 0px 3px rgba(46, 125, 50, 0.3)',
          },
          '&:active': {
            backgroundColor: isDisabled ? 'rgba(0, 0, 0, 0.12)' : 'rgb(27, 94, 32)',
            boxShadow: isDisabled ? 'none' : '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
            transform: isDisabled ? 'none' : 'translateY(0)',
          },
        }}
      >
        {loading ? 'Generando...' : progreso < 70 ? `Progreso del curso: ${progreso}%` : '🎓 Generar Cuestionario Final'}
      </Box>
    </Tooltip>
  );
}
