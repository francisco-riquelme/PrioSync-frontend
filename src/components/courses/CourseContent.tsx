'use client';

import React, { useState } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import CourseLessons from './CourseLessons';
import CourseMaterials from './CourseMaterials';
import CourseQuizzes from './CourseQuizzes';
import GenerateFinalQuizButton from './GenerateFinalQuizButton';
import { useUser } from '@/contexts/UserContext';
import type { ModuloWithLecciones, MaterialFromCourse, CuestionarioFromCourse } from './hooks/useCourseDetailData';

interface CourseContentProps {
  modulos: ModuloWithLecciones[];
  materiales: MaterialFromCourse[];
  materialesLoading: boolean;
  cuestionarios: CuestionarioFromCourse[];
  quizzesLoading: boolean;
  onQuizCreated?: () => void;
  onMaterialCreated?: () => void;
  cursoId: string;
  onWorkflowStatusChange?: (isWaiting: boolean) => void;
}

export default function CourseContent({ 
  modulos, 
  materiales, 
  materialesLoading, 
  cuestionarios, 
  quizzesLoading,
  onQuizCreated,
  onMaterialCreated,
  cursoId,
  onWorkflowStatusChange
}: CourseContentProps) {
  const { userData } = useUser();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });

  const onNotify = (msg: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message: msg, severity });
  };

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  // Verificar si existe cuestionario final (tipo === "prueba_final")
  const hasFinalQuiz = cuestionarios.some(q => q.tipo === 'prueba_final');

  return (
    <Box>
      <CourseLessons 
        modulos={modulos} 
        loading={false} 
        onQuizCreated={onQuizCreated} 
        materiales={materiales} 
        onMaterialCreated={onMaterialCreated} 
      />
      
      {/* Botón para generar cuestionario final - solo visible si el usuario está logueado y no existe cuestionario final */}
      {userData?.usuarioId && !hasFinalQuiz && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <GenerateFinalQuizButton
            cursoId={cursoId}
            modulos={modulos}
            usuarioId={userData.usuarioId}
            onSuccess={onQuizCreated}
            onNotify={onNotify}
            onWorkflowStatusChange={onWorkflowStatusChange}
          />
        </Box>
      )}

      <CourseMaterials materiales={materiales} loading={materialesLoading} />
      <CourseQuizzes cuestionarios={cuestionarios} loading={quizzesLoading} />
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
