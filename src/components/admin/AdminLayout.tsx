'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert
} from '@mui/material'
import { useAuth } from '@/contexts/UserContext'

export default function AdminUploadPage() {
  const router = useRouter()
  const { userData, isLoading } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAdminAccess = () => {
      // Verificar variable de entorno
      const isAdminMode = process.env.NEXT_PUBLIC_IS_ADMIN_MODE === 'true'
      
      // Verificar si la variable de entorno permite acceso
      if (isAdminMode) {
        setIsAuthorized(true)
      } else {
        // Redirigir si no tiene permisos
        router.push('/')
      }
      
      setChecking(false)
    }

    if (!isLoading) {
      checkAdminAccess()
    }
  }, [isLoading, router])

  if (isLoading || checking) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthorized) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          No tienes permisos para acceder a esta página
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Administrador - Cargar Videos
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Sube videos para generar transcripciones automáticamente
      </Typography>

      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Formulario de Carga de Videos
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          El formulario de subida de videos y la integración con LLM para 
          transcripción se implementará en la siguiente tarea.
        </Typography>
        
        <Box 
          sx={{ 
            mt: 4, 
            p: 3, 
            border: '2px dashed',
            borderColor: 'grey.300',
            borderRadius: 2,
            textAlign: 'center',
            backgroundColor: 'grey.50'
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Área de carga de videos (próximamente)
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}