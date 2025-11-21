'use client';

import React from 'react';
import { Box, CircularProgress } from '@mui/material';

export default function FullScreenLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

