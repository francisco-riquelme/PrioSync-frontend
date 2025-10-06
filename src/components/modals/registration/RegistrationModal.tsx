"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PersonAdd,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import WelcomeSummary from './WelcomeSummary';
import RegistrationForm from './RegistrationForm';
import { 
  RegistrationFormData,
  RegistrationFormFields,
  ERROR_MESSAGES, 
  validateEmail, 
  validatePassword,
  validateChileanPhone,
  validateName
} from './types';
import { WelcomeFormData } from '../welcome/types';

interface RegistrationModalProps {
  open: boolean;
  onClose: () => void;
  welcomeData?: WelcomeFormData;
  onRegister: (data: RegistrationFormData) => void;
}

export default function RegistrationModal({ open, onClose, welcomeData, onRegister }: RegistrationModalProps) {
  const [formData, setFormData] = useState<RegistrationFormFields>(() => {
    // Cargar datos persistentes del localStorage si existen
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('registrationFormData');
      if (savedData) {
        return JSON.parse(savedData) as RegistrationFormFields;
      }
    }
    return {
      nombre: '',
      apellido: '',
      telefono: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
  });
  const [errors, setErrors] = useState({
    nombre: false,
    apellido: false,
    telefono: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Persistencia: guardar datos en localStorage cada vez que cambien
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('registrationFormData', JSON.stringify(formData));
    }
  }, [formData]);

  // Limpiar formulario
  const clearForm = () => {
    const initialFormData: RegistrationFormFields = {
      nombre: '',
      apellido: '',
      telefono: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    setFormData(initialFormData);
    setErrors({
      nombre: false,
      apellido: false,
      telefono: false,
      email: false,
      password: false,
      confirmPassword: false
    });
    setLocalError('');
    setLoading(false);
    setSuccess(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('registrationFormData');
    }
  };

  // Manejar cancelar: cerrar modal y limpiar formulario
  const handleCancel = () => {
    clearForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');
    setErrors({ 
      nombre: false, 
      apellido: false, 
      telefono: false, 
      email: false, 
      password: false, 
      confirmPassword: false 
    });

    // Validar nombre
    if (!validateName(formData.nombre)) {
      setLocalError(ERROR_MESSAGES.INVALID_NAME);
      setErrors(prev => ({ ...prev, nombre: true }));
      return;
    }

    // Validar apellido
    if (!validateName(formData.apellido)) {
      setLocalError(ERROR_MESSAGES.INVALID_LASTNAME);
      setErrors(prev => ({ ...prev, apellido: true }));
      return;
    }

    // Validar teléfono
    if (!validateChileanPhone(formData.telefono)) {
      setLocalError(ERROR_MESSAGES.INVALID_PHONE);
      setErrors(prev => ({ ...prev, telefono: true }));
      return;
    }

    // Validar email
    if (!formData.email || !validateEmail(formData.email)) {
      setLocalError(ERROR_MESSAGES.INVALID_EMAIL);
      setErrors(prev => ({ ...prev, email: true }));
      return;
    }

    // Validar contraseña
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setLocalError(passwordValidation.message || ERROR_MESSAGES.PASSWORD_WEAK);
      setErrors(prev => ({ ...prev, password: true }));
      return;
    }

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      setLocalError(ERROR_MESSAGES.PASSWORDS_DONT_MATCH);
      setErrors(prev => ({ ...prev, confirmPassword: true }));
      return;
    }

    // Simular proceso de registro
    setLoading(true);
    
    try {
      // Aquí llamarías a tu servicio de AWS
      const registrationData: RegistrationFormData = {
        ...formData,
        welcomeData
      };
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onRegister(registrationData);
      setSuccess(true);
      
      // Cerrar modal después del éxito y limpiar datos
      setTimeout(() => {
        clearForm();
        onClose();
      }, 2000);
      
    } catch {
      setLocalError(ERROR_MESSAGES.REGISTRATION_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const clearErrors = () => {
    setLocalError('');
    setErrors({ 
      nombre: false, 
      apellido: false, 
      telefono: false, 
      email: false, 
      password: false, 
      confirmPassword: false 
    });
  };

  const handleNombreChange = (value: string) => {
    setFormData((prev: RegistrationFormFields) => ({ ...prev, nombre: value }));
    if (localError || errors.nombre) clearErrors();
  };

  const handleApellidoChange = (value: string) => {
    setFormData((prev: RegistrationFormFields) => ({ ...prev, apellido: value }));
    if (localError || errors.apellido) clearErrors();
  };

  const handleTelefonoChange = (value: string) => {
    setFormData((prev: RegistrationFormFields) => ({ ...prev, telefono: value }));
    if (localError || errors.telefono) clearErrors();
  };

  const handleEmailChange = (value: string) => {
    setFormData((prev: RegistrationFormFields) => ({ ...prev, email: value }));
    if (localError || errors.email) clearErrors();
  };

  const handlePasswordChange = (value: string) => {
    setFormData((prev: RegistrationFormFields) => ({ ...prev, password: value }));
    if (localError || errors.password) clearErrors();
  };

  const handleConfirmPasswordChange = (value: string) => {
    setFormData((prev: RegistrationFormFields) => ({ ...prev, confirmPassword: value }));
    if (localError || errors.confirmPassword) clearErrors();
  };

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Desactivar cierre al hacer clic fuera
      disableEscapeKeyDown // Desactivar cierre con tecla Escape
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            mb: 2,
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PersonAdd fontSize="large" />
          </Box>
          <Typography
            variant="h4"
            component="div"
            sx={{
              fontWeight: 500,
              color: '#1976d2',
            }}
          >
            PrioSync
          </Typography>
        </Box>
        
        <Typography
          variant="h5"
          component="div"
          sx={{
            fontWeight: 300,
            color: '#212121',
            mb: 1,
          }}
        >
          Crear Nueva Cuenta
        </Typography>
        
        <Typography
          variant="body1"
          sx={{
            color: '#757575',
            lineHeight: 1.5,
          }}
        >
          {welcomeData ? `¡Hola ${welcomeData.nombre}!` : ''} Completa el registro para comenzar
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 4, pb: 2 }}>
        {/* Resumen de datos de bienvenida */}
        {welcomeData && <WelcomeSummary welcomeData={welcomeData} />}

        {/* Mensajes de estado */}
        {localError && (
          <Alert
            severity="error"
            icon={<Error />}
            sx={{ mb: 2 }}
            onClose={() => setLocalError('')}
          >
            {localError}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            icon={<CheckCircle />}
            sx={{ mb: 2 }}
          >
            ¡Cuenta creada exitosamente! Redirigiendo...
          </Alert>
        )}

        {/* Formulario */}
        <RegistrationForm
          formData={formData}
          errors={errors}
          loading={loading}
          onNombreChange={handleNombreChange}
          onApellidoChange={handleApellidoChange}
          onTelefonoChange={handleTelefonoChange}
          onEmailChange={handleEmailChange}
          onPasswordChange={handlePasswordChange}
          onConfirmPasswordChange={handleConfirmPasswordChange}
          onSubmit={handleSubmit}
        />
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 3 }}>
        <Button
          onClick={handleCancel}
          variant="outlined"
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        
        <Button
          type="submit"
          form="registration-form"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
          sx={{
            borderRadius: 2,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            },
            '&:disabled': {
              background: '#e0e0e0',
              color: '#9e9e9e',
            },
          }}
        >
          {loading ? 'Creando Cuenta...' : 'Crear Cuenta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}