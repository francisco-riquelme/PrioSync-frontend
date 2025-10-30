'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, Button, Alert } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { AmplifyOutputsType, initializeQueries, AmplifyModelType } from "@/utils/commons/queries";
import amplifyOutputs from "../../../amplify_outputs.json";
import { MainSchema } from "@/utils/api/schema";

interface AmplifyProviderProps {
  children: React.ReactNode;
}

interface AmplifyContextType {
  isInitialized: boolean;
}

const AmplifyContext = createContext<AmplifyContextType>({ isInitialized: false });

export const useAmplify = () => useContext(AmplifyContext);

export default function AmplifyProvider({ children }: AmplifyProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const initializeAmplify = async () => {
      try {
        // initializeQueries handles both Amplify configuration and client initialization
        await initializeQueries<typeof MainSchema, Record<string, AmplifyModelType>>({
          amplifyOutputs: amplifyOutputs as unknown as AmplifyOutputsType,
          schema: MainSchema,
          cache: { enabled: true, maxSize: 50 * 1024 * 1024 },
          clientKey: "default"
        });

        setIsInitialized(true);
        console.log('✅ Amplify initialized successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('❌ Failed to initialize Amplify:', errorMessage);
      }
    };

    if (isMounted) {
      initializeAmplify();
    }
  }, [isMounted]);

  // Prevent hydration mismatch by not rendering loading UI on server
  if (!isMounted) {
    return null;
  }

  if (!isInitialized && !error) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress 
            size={48} 
            thickness={4}
            sx={{ mb: 2 }}
          />
          <Typography variant="body1" color="text.secondary">
            Initializing database connection...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          p: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 500,
            width: '100%',
            p: 4,
            textAlign: 'center',
          }}
        >
          <ErrorIcon 
            sx={{ 
              fontSize: 64, 
              color: 'error.main',
              mb: 2,
            }} 
          />
          
          <Typography 
            variant="h5" 
            color="error" 
            gutterBottom
            fontWeight={600}
          >
            Database Connection Error
          </Typography>
          
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            {error}
          </Alert>
          
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
            sx={{
              px: 4,
              py: 1.5,
            }}
          >
            Retry Connection
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <AmplifyContext.Provider value={{ isInitialized }}>
      {children}
    </AmplifyContext.Provider>
  );
}
