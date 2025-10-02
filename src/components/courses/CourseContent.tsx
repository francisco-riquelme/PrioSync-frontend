'use client';

import React from 'react';
import { Box } from '@mui/material';
import CourseLessons from './CourseLessons';
import CourseMaterials from './CourseMaterials';

interface CourseContentProps {
  courseId: string;
}

export default function CourseContent({ courseId }: CourseContentProps) {
  return (
    <Box>
      <CourseLessons courseId={courseId} />
      <CourseMaterials courseId={courseId} />
    </Box>
  );
}
