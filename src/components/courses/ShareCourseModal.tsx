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
  Alert,
  IconButton,
} from '@mui/material';
import {
  Share as ShareIcon,
  Close as CloseIcon,
  WhatsApp as WhatsAppIcon,
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
  const { crearCursoCompartido, generateWhatsAppUrl, loading, error } = useCompartirCurso();
  
  const [shareData, setShareData] = useState<{
    shareUrl: string;
    shareCode: string;
  } | null>(null);
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
      setIsGenerating(false);
    }
  }, [open]);

  const handleClose = () => {
    setShareData(null);
    onClose();
  };

  const handleWhatsAppShare = () => {
    if (!shareData) return;
    
    const whatsappUrl = generateWhatsAppUrl(courseTitle, shareData.shareUrl, shareData.shareCode);
    window.open(whatsappUrl, '_blank');
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

          {/* Contenido para WhatsApp */}
          {shareData && !loading && !isGenerating && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                ¡Listo para compartir! 📱
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Comparte <strong>{courseTitle}</strong> directamente por WhatsApp
              </Typography>

              {/* Botón principal de WhatsApp */}
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleWhatsAppShare}
                startIcon={<WhatsAppIcon />}
                sx={{
                  mb: 3,
                  py: 2,
                  borderRadius: 3,
                  backgroundColor: '#25D366',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#1da851',
                  },
                  '&:active': {
                    backgroundColor: '#128c3e',
                  }
                }}
              >
                Compartir por WhatsApp
              </Button>

              {/* Preview del mensaje */}
              <Box sx={{ p: 3, backgroundColor: 'grey.50', borderRadius: 2, textAlign: 'left' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  Vista previa del mensaje:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-line' }}>
                  🎓 ¡Te han compartido un curso!{'\n\n'}
                  📚 {courseTitle}{'\n\n'}
                  🔗 {shareData.shareUrl}{'\n\n'}
                  📋 Código: {shareData.shareCode}{'\n\n'}
                  ¡Aprende algo nuevo hoy! 🚀
                </Typography>
              </Box>
            </Box>
          )}

          {/* Estado inicial - sin datos generados */}
          {!shareData && !loading && !isGenerating && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Preparando el enlace para compartir...
              </Typography>
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
        </DialogActions>
      </Dialog>
    </>
  );
}