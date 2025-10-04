'use client';

import React from 'react';
import { Box } from '@mui/material';
import CourseLessons from './CourseLessons';
import CourseMaterials from './CourseMaterials';
import CourseQuizzes from './CourseQuizzes';

interface CourseContentProps {
  courseId: string;
  usuarioId: string;
}

export default function CourseContent({ courseId, usuarioId }: CourseContentProps) {
  return (
    <Box>
      <CourseLessons courseId={courseId} />
      <CourseMaterials courseId={courseId} />
      <CourseQuizzes courseId={courseId} usuarioId={usuarioId} />
    </Box>
  );
}
