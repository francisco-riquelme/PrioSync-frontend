'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Box, 
  Container, 
  Typography, 
  CircularProgress,
  Alert
} from '@mui/material'

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AdminLayout({ 
  children, 
  title = "Administrador", 
  subtitle 
}: AdminLayoutProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Verificar variable de entorno del lado del cliente
      const isAdminMode = process.env.NEXT_PUBLIC_IS_ADMIN_MODE === 'true'
      
      if (isAdminMode) {
        setIsAuthorized(true)
      } else {
        // Redirigir si no tiene permisos
        router.push('/')
      }
      
      setChecking(false)
      setMounted(true)
    }

    checkAdminAccess()
  }, [router])

  // Evitar renderizar contenido hasta que la hidratación esté completa
  if (!mounted) {
    return null
  }

  // Mostrar loading durante la verificación de permisos
  if (checking) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
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
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            p: 4,
            mb: 4
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{
              color: 'primary.main',
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 2
            }}
          >
            {title}
          </Typography>
          
          {subtitle && (
            <Typography 
              variant="subtitle1" 
              color="text.secondary" 
              sx={{ 
                mb: 4,
                textAlign: 'center',
                maxWidth: '800px',
                mx: 'auto'
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Paper>

        {children}
      </Container>
    </Box>
  )
}