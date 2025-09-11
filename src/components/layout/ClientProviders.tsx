'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../../theme/theme';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '../../theme/createEmotionCache';

const clientSideEmotionCache = createEmotionCache();

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={clientSideEmotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}