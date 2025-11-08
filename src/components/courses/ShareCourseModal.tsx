'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  Divider,
  Chip,
} from '@mui/material';
import {
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  QrCode as QrCodeIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useCompartirCurso } from './hooks/useCompartirCurso';
import { useUser } from '@/contexts/UserContext';

interface ShareCourseModalProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
}

export default function ShareCourseModal({ 
  open, 
  onClose, 
  courseId, 
  courseTitle 
}: ShareCourseModalProps) {
  const { userData } = useUser();
  const { crearCursoCompartido, loading, error } = useCompartirCurso();
  
  const [shareData, setShareData] = useState<{
    shareUrl: string;
    shareCode: string;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generar enlace de compartir cuando se abre el modal
  useEffect(() => {
    const generateLink = async () => {
      if (!userData?.usuarioId) return;

      setIsGenerating(true);
      
      try {
        const result = await crearCursoCompartido({
          usuarioId: userData.usuarioId,
          cursoId: courseId,
          estado: 'inscrito'
        });

        if (result) {
          setShareData(result);
        }
      } catch (err) {
        console.error('Error generando enlace:', err);
      } finally {
        setIsGenerating(false);
      }
    };

    if (open && userData?.usuarioId && !shareData) {
      generateLink();
    }
  }, [open, userData?.usuarioId, shareData, crearCursoCompartido, courseId]);

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!open) {
      setShareData(null);
      setCopySuccess(false);
      setIsGenerating(false);
    }
  }, [open]);



  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      
      // Auto-ocultar el mensaje después de 2 segundos
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error copiando al portapapeles:', err);
    }
  };

  const handleClose = () => {
    setShareData(null);
    setCopySuccess(false);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white',
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShareIcon fontSize="large" />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                Compartir Curso
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {courseTitle}
              </Typography>
            </Box>
            <IconButton onClick={handleClose} edge="end">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          {/* Estado de error */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Estado de carga */}
          {(loading || isGenerating) && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Generando enlace de compartir...
              </Typography>
            </Box>
          )}

          {/* Enlace generado */}
          {shareData && !loading && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                ¡Enlace listo para compartir! 🚀
              </Typography>

              {/* Tarjeta con enlace */}
              <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <LinkIcon color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      Enlace del curso
                    </Typography>
                  </Box>
                  
                  <TextField
                    fullWidth
                    value={shareData.shareUrl}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleCopyToClipboard(shareData.shareUrl)}
                            edge="end"
                            color="primary"
                          >
                            <CopyIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#f8f9fa',
                      },
                    }}
                  />
                </CardContent>
              </Card>

              {/* Tarjeta con código */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <QrCodeIcon color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      Código de acceso
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={shareData.shareCode}
                      variant="outlined"
                      color="primary"
                      sx={{ 
                        fontSize: '1rem',
                        fontFamily: 'monospace',
                        px: 2,
                        py: 1,
                        height: 'auto'
                      }}
                    />
                    <IconButton
                      onClick={() => handleCopyToClipboard(shareData.shareCode)}
                      color="primary"
                    >
                      <CopyIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>

              <Divider sx={{ my: 3 }} />

              {/* Instrucciones */}
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                  ¿Cómo funciona?
                </Typography>
                <Box component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
                  <li>
                    <Typography variant="body2">
                      Comparte el enlace o código con las personas que quieras
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Ellos podrán acceder al curso desde su cuenta
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Verán todo el contenido y podrán seguir su propio progreso
                    </Typography>
                  </li>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cerrar
          </Button>
          
          {shareData && (
            <Button
              onClick={() => handleCopyToClipboard(shareData.shareUrl)}
              variant="contained"
              startIcon={<ShareIcon />}
              sx={{
                borderRadius: 2,
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              }}
            >
              Copiar Enlace
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar de confirmación */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setCopySuccess(false)} 
          severity="success" 
          icon={<CheckIcon />}
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          ¡Copiado al portapapeles!
        </Alert>
      </Snackbar>
    </>
  );
}