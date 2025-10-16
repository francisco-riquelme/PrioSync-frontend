"use client";

import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'next/navigation';
import WelcomeSummary from './WelcomeSummary';
import RegistrationForm from './RegistrationForm';
import { 
  RegistrationFormData,
  RegistrationFormFields,
  ERROR_MESSAGES, 
  validateEmail, 
  validatePassword,
  validateName
} from './types';
import { WelcomeFormData } from '../welcome/types';
import { authService } from '@/utils/services/auth';

// Function to split name into nombre and apellido based on word count
const splitName = (fullName: string): { nombre: string; apellido: string } => {
  const words = fullName.trim().split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) {
    return { nombre: '', apellido: '' };
  } else if (words.length === 1) {
    return { nombre: words[0], apellido: '' };
  } else if (words.length === 2) {
    return { nombre: words[0], apellido: words[1] };
  } else if (words.length === 3) {
    return { nombre: `${words[0]} ${words[1]}`, apellido: words[2] };
  } else if (words.length === 4) {
    return { nombre: `${words[0]} ${words[1]}`, apellido: `${words[2]} ${words[3]}` };
  } else {
    // 5+ words: first words as nombre, last 2 as apellido
    const nombre = words.slice(0, -2).join(' ');
    const apellido = words.slice(-2).join(' ');
    return { nombre, apellido };
  }
};

interface RegistrationModalProps {
  open: boolean;
  onClose: () => void;
  welcomeData?: WelcomeFormData;
  onRegister: (data: RegistrationFormData) => void;
}

export default function RegistrationModal({ open, onClose, welcomeData }: RegistrationModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<RegistrationFormFields>(() => {
    // Cargar datos persistentes del localStorage si existen
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('registrationFormData');
      if (savedData) {
        return JSON.parse(savedData) as RegistrationFormFields;
      }
    }
    
    // Pre-fill name fields from welcome data if available
    const initialData: RegistrationFormFields = {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    
    if (welcomeData?.nombre) {
      const { nombre, apellido } = splitName(welcomeData.nombre);
      initialData.nombre = nombre;
      initialData.apellido = apellido;
    }
    
    return initialData;
  });
  const [errors, setErrors] = useState({
    nombre: false,
    apellido: false,
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

  // Resetear formulario cuando se abre el modal y no hay datos en localStorage (indica cancelación)
  React.useEffect(() => {
    if (open && typeof window !== 'undefined') {
      const savedData = localStorage.getItem('registrationFormData');
      
      // Si no hay datos guardados, resetear el formulario (usuario canceló anteriormente)
      if (!savedData) {
        setFormData({
          nombre: '',
          apellido: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setErrors({
          nombre: false,
          apellido: false,
          email: false,
          password: false,
          confirmPassword: false
        });
        setLocalError('');
        setLoading(false);
        setSuccess(false);
      } else {
        // Si hay datos guardados, cargarlos (restaurar después de cierre accidental)
        setFormData(JSON.parse(savedData));
      }
    }
  }, [open]);

  // Limpiar formulario
  const clearForm = () => {
    const initialFormData: RegistrationFormFields = {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    setFormData(initialFormData);
    setErrors({
      nombre: false,
      apellido: false,
      email: false,
      password: false,
      confirmPassword: false
    });
    setLocalError('');
    setLoading(false);
    setSuccess(false);
    // localStorage se limpia en el padre (LandingPage) antes de cerrar el modal
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
      // Call AWS Amplify signup with study preferences
      const signupResult = await authService.signUpWithStudyPreferences({
        email: formData.email,
        password: formData.password,
        firstName: formData.nombre,
        lastName: formData.apellido,
        timeSlots: welcomeData?.tiempoDisponible || [],
        playlistUrl: welcomeData?.youtubeUrl,
        areaOfInterest: welcomeData?.estudio,
      });

      if (signupResult.success) {
        setSuccess(true);
        
        // Redirect to verification page after short delay
        setTimeout(() => {
          clearForm();
          onClose();
          router.push(`/auth/verification?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
      } else {
        // Handle specific AWS Amplify errors
        let errorMessage: string = ERROR_MESSAGES.REGISTRATION_FAILED;
        
        if (signupResult.error) {
          if (signupResult.error.includes('UsernameExistsException')) {
            errorMessage = 'Este correo ya está registrado';
          } else if (signupResult.error.includes('InvalidPasswordException')) {
            errorMessage = 'La contraseña no cumple los requisitos';
          } else if (signupResult.error.includes('InvalidParameterException')) {
            errorMessage = 'Formato de datos inválido';
          }
        }
        
        setLocalError(errorMessage);
      }
      
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