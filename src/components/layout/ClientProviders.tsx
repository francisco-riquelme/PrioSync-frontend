'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../../theme/theme';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '../../theme/createEmotionCache';
import { useEffect, useState } from 'react';

const clientSideEmotionCache = createEmotionCache();

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return (
    <CacheProvider value={clientSideEmotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}