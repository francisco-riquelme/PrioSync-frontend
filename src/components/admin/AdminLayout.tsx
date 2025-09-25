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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          {subtitle}
        </Typography>
      )}

      {children}
    </Container>
  )
}