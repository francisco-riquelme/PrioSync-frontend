'use client';

import React from 'react';
import { Box } from '@mui/material';
import CourseLessons from './CourseLessons';
import CourseMaterials from './CourseMaterials';
import CourseQuizzes from './CourseQuizzes';
import type { ModuloWithLecciones, MaterialFromCourse, CuestionarioFromCourse } from './hooks/useCourseDetailData';

interface CourseContentProps {
  modulos: ModuloWithLecciones[];
  materiales: MaterialFromCourse[];
  materialesLoading: boolean;
  cuestionarios: CuestionarioFromCourse[];
  quizzesLoading: boolean;
}

export default function CourseContent({ 
  modulos, 
  materiales, 
  materialesLoading, 
  cuestionarios, 
  quizzesLoading 
}: CourseContentProps) {
  return (
    <Box>
      <CourseLessons modulos={modulos} loading={false} />
      <CourseMaterials materiales={materiales} loading={materialesLoading} />
      <CourseQuizzes cuestionarios={cuestionarios} loading={quizzesLoading} />
    </Box>
  );
}
