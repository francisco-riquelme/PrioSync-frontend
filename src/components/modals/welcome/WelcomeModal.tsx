"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import NameStep from './NameStep';
import StudyResourcesStep from './StudyResourcesStep';
import ScheduleStep from './ScheduleStep';
import { WelcomeFormData, steps, isValidYouTubeUrl } from './types';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: WelcomeFormData) => void;
}

export default function WelcomeModal({ open, onClose, onComplete }: WelcomeModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<WelcomeFormData>({
    nombre: '',
    estudio: '',
    youtubeUrl: '',
    tiempoDisponible: []
  });
  const [errors, setErrors] = useState({
    nombre: false,
    estudio: false,
    youtubeUrl: false,
    tiempoDisponible: false
  });


  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (open) {
      setFormData({
        nombre: '',
        estudio: '',
        youtubeUrl: '',
        tiempoDisponible: []
      });
      setErrors({
        nombre: false,
        estudio: false,
        youtubeUrl: false,
        tiempoDisponible: false
      });
      setActiveStep(0);
    }
  }, [open]);

  // Limpiar formulario
  const clearForm = () => {
    const initialFormData = {
      nombre: '',
      estudio: '',
      youtubeUrl: '',
      tiempoDisponible: []
    };
    setFormData(initialFormData);
    setActiveStep(0);
    setErrors({
      nombre: false,
      estudio: false,
      youtubeUrl: false,
      tiempoDisponible: false
    });
  };

  // Manejar cancelar: cerrar modal y limpiar formulario
  const handleCancel = () => {
    clearForm();
    onClose();
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (activeStep === steps.length - 1) {
        onComplete(formData);
      } else {
        setActiveStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const validateCurrentStep = (): boolean => {
    const newErrors = { ...errors };
    let isValid = true;

    switch (activeStep) {
      case 0: // Nombre
        if (!formData.nombre.trim()) {
          newErrors.nombre = true;
          isValid = false;
        } else {
          newErrors.nombre = false;
        }
        break;
      case 1: // Estudio y YouTube
        if (!formData.estudio.trim()) {
          newErrors.estudio = true;
          isValid = false;
        } else {
          newErrors.estudio = false;
        }
        // YouTube es ahora obligatorio
        if (!formData.youtubeUrl.trim()) {
          newErrors.youtubeUrl = true;
          isValid = false;
        } else if (!isValidYouTubeUrl(formData.youtubeUrl)) {
          newErrors.youtubeUrl = true;
          isValid = false;
        } else {
          newErrors.youtubeUrl = false;
        }
        break;
      case 2: // Horarios
        const totalTimeSlots = formData.tiempoDisponible?.reduce((total, day) => total + day.timeSlots.length, 0) || 0;
        if (!formData.tiempoDisponible || formData.tiempoDisponible.length === 0 || totalTimeSlots < 1) {
          newErrors.tiempoDisponible = true;
          isValid = false;
        } else {
          newErrors.tiempoDisponible = false;
        }
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleStringFieldChange = (field: 'nombre' | 'estudio' | 'youtubeUrl') => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error al escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleScheduleChange = (schedule: WelcomeFormData['tiempoDisponible']) => {
    setFormData(prev => ({
      ...prev,
      tiempoDisponible: schedule
    }));
    // Limpiar error al cambiar
    if (errors.tiempoDisponible) {
      setErrors(prev => ({ ...prev, tiempoDisponible: false }));
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <NameStep
            nombre={formData.nombre}
            onChange={handleStringFieldChange('nombre')}
            error={errors.nombre}
          />
        );
      case 1:
        return (
          <StudyResourcesStep
            estudio={formData.estudio}
            youtubeUrl={formData.youtubeUrl}
            onStudyChange={handleStringFieldChange('estudio')}
            onYouTubeChange={handleStringFieldChange('youtubeUrl')}
            studyError={errors.estudio}
            youtubeError={errors.youtubeUrl}
          />
        );
      case 2:
        return (
          <ScheduleStep
            schedule={formData.tiempoDisponible}
            onChange={handleScheduleChange}
            error={errors.tiempoDisponible}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Desactivar cierre al hacer clic fuera
      disableEscapeKeyDown // Desactivar cierre con tecla Escape
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '500px'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h4" component="div" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 2 }}>
          ¡Bienvenido a PrioSync! 🎓
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleCancel}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            variant="outlined"
            sx={{ borderRadius: 2, ml: 1 }}
          >
            Atrás
          </Button>
        )}
        
        <Button
          onClick={handleNext}
          variant="contained"
          sx={{
            borderRadius: 2,
            ml: 1,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          }}
        >
          {activeStep === steps.length - 1 ? 'Continuar' : 'Siguiente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}