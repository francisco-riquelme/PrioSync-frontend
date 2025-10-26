'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Rating,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Feedback as FeedbackIcon,
} from '@mui/icons-material';
import { EvaluacionFormData, RATING_CONFIG, validateEvaluacion } from '@/types/evaluacion';

interface CourseFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EvaluacionFormData) => Promise<boolean>;
  courseTitle: string;
  initialData?: {
    calificacion?: number;
    comentario?: string;
  };
  saving?: boolean;
}

export default function CourseFeedbackModal({
  open,
  onClose,
  onSubmit,
  courseTitle,
  initialData,
  saving = false,
}: CourseFeedbackModalProps) {
  const [formData, setFormData] = useState<EvaluacionFormData>({
    calificacion: initialData?.calificacion || RATING_CONFIG.DEFAULT,
    comentario: initialData?.comentario || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EvaluacionFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hover, setHover] = useState(-1);

  // Actualizar formulario cuando cambien los datos iniciales
  useEffect(() => {
    if (open) {
      setFormData({
        calificacion: initialData?.calificacion || RATING_CONFIG.DEFAULT,
        comentario: initialData?.comentario || '',
      });
      setErrors({});
      setSubmitError(null);
      setHover(-1);
    }
  }, [open, initialData]);

  const handleRatingChange = (_event: React.SyntheticEvent, value: number | null) => {
    setFormData((prev) => ({
      ...prev,
      calificacion: value || RATING_CONFIG.DEFAULT,
    }));
    setErrors((prev) => ({ ...prev, calificacion: undefined }));
  };

  const handleComentarioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      comentario: value,
    }));
    setErrors((prev) => ({ ...prev, comentario: undefined }));
  };

  const handleSubmit = async () => {
    // Validar datos
    const validation = validateEvaluacion(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitError(null);

    // Enviar datos
    const success = await onSubmit(formData);

    if (success) {
      onClose();
    } else {
      setSubmitError('Error al guardar la evaluación. Por favor intenta nuevamente.');
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  const getRatingLabel = (value: number): string => {
    return RATING_CONFIG.LABELS[value] || '';
  };

  const isEditMode = initialData?.calificacion !== undefined && initialData.calificacion > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <FeedbackIcon color="primary" />
          <Box>
            <Typography variant="h6" component="div">
              {isEditMode ? 'Editar Evaluación' : 'Evaluar Curso'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {courseTitle}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={saving}
          sx={{ mt: -1, mr: -1 }}
          aria-label="cerrar"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Error general */}
          {submitError && (
            <Alert severity="error" onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}

          {/* Calificación con estrellas */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
              Calificación *
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                py: 2,
                borderRadius: 2,
                backgroundColor: 'action.hover',
              }}
            >
              <Rating
                name="course-rating"
                value={formData.calificacion}
                onChange={handleRatingChange}
                onChangeActive={(_event, newHover) => {
                  setHover(newHover);
                }}
                precision={1}
                size="large"
                icon={<StarIcon fontSize="inherit" />}
                emptyIcon={<StarBorderIcon fontSize="inherit" />}
                disabled={saving}
                sx={{
                  fontSize: '3rem',
                  '& .MuiRating-iconFilled': {
                    color: '#FFB400',
                  },
                  '& .MuiRating-iconHover': {
                    color: '#FFB400',
                  },
                }}
              />
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontWeight: 500, minHeight: 24 }}
              >
                {getRatingLabel(hover !== -1 ? hover : formData.calificacion)}
              </Typography>
            </Box>
            {errors.calificacion && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {errors.calificacion}
              </Typography>
            )}
          </Box>

          {/* Comentario */}
          <Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comentario"
              placeholder="Cuéntanos tu experiencia con este curso (opcional)"
              value={formData.comentario}
              onChange={handleComentarioChange}
              error={!!errors.comentario}
              helperText={
                errors.comentario ||
                `${formData.comentario.length}/500 caracteres${
                  formData.comentario.length >= 10 ? '' : ' (mínimo 10 si deseas agregar comentario)'
                }`
              }
              disabled={saving}
              inputProps={{
                maxLength: 500,
              }}
            />
          </Box>

          {/* Información adicional */}
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              Tu evaluación nos ayuda a mejorar la calidad de los cursos.
              {isEditMode && ' Puedes modificar tu evaluación en cualquier momento.'}
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={saving} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving || formData.calificacion === 0}
          startIcon={saving ? <CircularProgress size={16} /> : <FeedbackIcon />}
        >
          {saving ? 'Guardando...' : isEditMode ? 'Actualizar Evaluación' : 'Enviar Evaluación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
