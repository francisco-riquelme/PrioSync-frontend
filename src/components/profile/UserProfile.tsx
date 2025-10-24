'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid,
  Chip,
  Paper,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useUser } from '@/contexts/UserContext';
import { updatePassword } from 'aws-amplify/auth';
import { 
  savePhotoToLocalStorage, 
  loadPhotoFromLocalStorage, 
  removePhotoFromLocalStorage,
  getDetailedValidationErrorMessage,
  VALID_IMAGE_TYPES,
  MAX_FILE_SIZE
} from '@/utils/profilePhotoUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserProfile() {
  const { userData, loading, updateUser, refreshUser } = useUser();
  const [tabValue, setTabValue] = useState(0);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
  });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    nombre?: string;
    apellido?: string;
  }>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Función de validación
  const validateForm = () => {
    const errors: { nombre?: string; apellido?: string } = {};
    
    // Validar nombre
    if (!editFormData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    } else if (editFormData.nombre.trim().length < 4) {
      errors.nombre = 'El nombre debe tener al menos 4 caracteres';
    }
    
    // Validar apellido (opcional pero si se proporciona debe tener mínimo 4 caracteres)
    if (editFormData.apellido && editFormData.apellido.trim().length > 0 && editFormData.apellido.trim().length < 4) {
      errors.apellido = 'El apellido debe tener al menos 4 caracteres';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Función para limpiar errores de validación
  const clearValidationErrors = () => {
    setValidationErrors({});
  };

  // Función para manejar cambios en los inputs con validación en tiempo real
  const handleInputChange = (field: 'nombre' | 'apellido', value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error específico del campo cuando el usuario empiece a escribir
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Initialize form data when userData changes
  React.useEffect(() => {
    if (userData) {
      console.log('🔄 Componente: userData cambió, actualizando estado local');
      
      // Solo actualizar si los datos realmente cambiaron
      const newFormData = {
        nombre: userData.nombre || '',
        apellido: userData.apellido || '',
        email: userData.email || '',
      };
      
      // Comparar con datos actuales para evitar actualizaciones innecesarias
      if (
        editFormData.nombre !== newFormData.nombre ||
        editFormData.apellido !== newFormData.apellido ||
        editFormData.email !== newFormData.email
      ) {
        setEditFormData(newFormData);
        console.log('✅ FormData actualizado');
      }
      
      // Cargar foto desde localStorage solo si es necesario
      const savedPhoto = loadPhotoFromLocalStorage(userData.usuarioId);
      if (savedPhoto && savedPhoto !== profileImage) {
        setProfileImage(savedPhoto);
        console.log('✅ Foto cargada desde localStorage');
      } else if (!savedPhoto && userData.avatar !== profileImage) {
        setProfileImage(userData.avatar || null);
        console.log('✅ Foto cargada desde userData');
      }
    }
  }, [userData?.usuarioId, userData?.nombre, userData?.apellido, userData?.email]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userData) return;

    // Validar el archivo
    const validationError = getDetailedValidationErrorMessage(file);
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      // Limpiar el input para permitir seleccionar el mismo archivo otra vez
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProfileImage(result);
      
      // Guardar foto en localStorage
      savePhotoToLocalStorage(userData.usuarioId, result);
      console.log('✅ Foto de perfil guardada en localStorage');
      
      // Mostrar mensaje de éxito
      setMessage({ type: 'success', text: 'Foto de perfil actualizada correctamente' });
    };
    
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Error al procesar la imagen' });
    };
    
    reader.readAsDataURL(file);
  };

  const handleEditProfile = () => {
    console.log('🔄 Activando modo de edición...');
    clearValidationErrors(); // Limpiar errores de validación
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    console.log('🔄 Cancelando edición...');
    setIsEditing(false);
    clearValidationErrors(); // Limpiar errores de validación
    // Restaurar datos originales
    if (userData) {
      setEditFormData({
        nombre: userData.nombre || '',
        apellido: userData.apellido || '',
        email: userData.email || '',
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!userData) {
      setMessage({ type: 'error', text: 'No hay datos de usuario disponibles' });
      return;
    }

    // Validar formulario antes de guardar
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Por favor corrige los errores antes de guardar' });
      return;
    }

    setIsSaving(true);
    try {
      console.log('🔄 Iniciando actualización de perfil...', {
        nombre: editFormData.nombre,
        apellido: editFormData.apellido,
        usuarioId: userData.usuarioId
      });

      // Actualizar datos en la base de datos
      await updateUser({
        nombre: editFormData.nombre.trim(),
        apellido: editFormData.apellido?.trim() || null,
      });

      // Guardar foto en localStorage si hay una nueva
      if (profileImage && profileImage !== userData.avatar) {
        savePhotoToLocalStorage(userData.usuarioId, profileImage);
      }

      setMessage({ type: 'success', text: 'Perfil actualizado correctamente en la base de datos' });
      setIsEditing(false);
      
      console.log('✅ Perfil actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      setMessage({ type: 'error', text: `Error al actualizar el perfil: ${error instanceof Error ? error.message : 'Error desconocido'}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validaciones
    if (!passwordFormData.currentPassword.trim()) {
      setMessage({ type: 'error', text: 'La contraseña actual es obligatoria' });
      return;
    }
    
    if (!passwordFormData.newPassword.trim()) {
      setMessage({ type: 'error', text: 'La nueva contraseña es obligatoria' });
      return;
    }
    
    if (passwordFormData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres' });
      return;
    }
    
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('🔄 Iniciando cambio de contraseña...');
      
      // Actualizar contraseña usando AWS Amplify
      await updatePassword({
        oldPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword
      });
      
      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setOpenPasswordDialog(false);
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      console.log('✅ Contraseña actualizada exitosamente');
    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      
      // Manejar errores específicos de AWS Amplify
      let errorMessage = 'Error al cambiar la contraseña';
      if (error instanceof Error) {
        if (error.message.includes('NotAuthorizedException')) {
          errorMessage = 'La contraseña actual es incorrecta';
        } else if (error.message.includes('InvalidPasswordException')) {
          errorMessage = 'La nueva contraseña no cumple con los requisitos de seguridad';
        } else if (error.message.includes('LimitExceededException')) {
          errorMessage = 'Demasiados intentos. Inténtalo más tarde';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Helper function to get user initials
  const getUserInitials = (nombre: string, apellido?: string | null) => {
    const firstInitial = nombre ? nombre.charAt(0).toUpperCase() : '';
    const lastInitial = apellido ? apellido.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  // Helper function to get full name
  const getFullName = (nombre: string, apellido?: string | null) => {
    return apellido ? `${nombre} ${apellido}` : nombre;
  };

  // Obtener actividades reales del usuario (si están disponibles en userData)
  const activityHistory = userData?.activities || [];


  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Header del perfil */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
          Mi Perfil
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona tu información personal y revisa tu progreso académico
        </Typography>
      </Box>

      {/* Mensaje de estado */}
      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Información Personal" />
          <Tab label="Historial de Actividad" />
        </Tabs>
      </Box>

      {/* Tab Panel 1: Información Personal */}
      <TabPanel value={tabValue} index={0}>
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            {/* Foto de perfil centrada */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={profileImage || undefined}
                  sx={{
                    width: 120,
                    height: 120,
                    backgroundColor: 'primary.main',
                    fontSize: '3rem',
                  }}
                >
                  {userData ? getUserInitials(userData.nombre, userData.apellido) : 'U'}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                  component="label"
                >
                  <PhotoCameraIcon />
                  <input
                    type="file"
                    hidden
                        accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageUpload}
                  />
                </IconButton>
              </Box>
            </Box>

            {/* Nombre centrado */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {userData ? getFullName(userData.nombre, userData.apellido) : 'Usuario'}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                {userData?.email || 'No disponible'}
              </Typography>
              {!isEditing ? (
                <Button
                  startIcon={<EditIcon />}
                  variant="outlined"
                  onClick={handleEditProfile}
                  sx={{ textTransform: 'none' }}
                >
                  Editar Información
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    startIcon={<SaveIcon />}
                    variant="contained"
                    onClick={handleSaveProfile}
                    disabled={isSaving || Object.keys(validationErrors).length > 0}
                    sx={{ 
                      textTransform: 'none',
                      backgroundColor: 'primary.main',
                      '&:hover': { backgroundColor: 'primary.dark' }
                    }}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Button
                    startIcon={<CancelIcon />}
                    variant="outlined"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    sx={{ textTransform: 'none' }}
                  >
                    Cancelar
                  </Button>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Datos del usuario - Inputs editables */}
            <Box sx={{ space: 2 }}>
              {/* Nombre */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Nombre
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  value={editFormData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  size="small"
                  error={!!validationErrors.nombre}
                  helperText={validationErrors.nombre}
                  placeholder="Ingresa tu nombre"
                />
              </Box>

              {/* Apellido */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Apellido
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  value={editFormData.apellido}
                  onChange={(e) => handleInputChange('apellido', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  size="small"
                  error={!!validationErrors.apellido}
                  helperText={validationErrors.apellido}
                  placeholder="Ingresa tu apellido"
                />
              </Box>

              {/* Email */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Correo Electrónico
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  value={editFormData.email}
                  disabled
                  variant="outlined"
                  size="small"
                  helperText="El correo electrónico no se puede cambiar"
                />
              </Box>

              {/* Información no editable */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Miembro desde
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500, pl: 4 }}>
                  {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('es-ES') : 'No disponible'}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SchoolIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Estado de Cuenta
                  </Typography>
                </Box>
                <Box sx={{ pl: 4 }}>
                  <Chip 
                    label={userData?.isValid ? 'Verificado' : 'Pendiente'} 
                    color={userData?.isValid ? 'success' : 'warning'} 
                    size="small" 
                  />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Sección de seguridad */}
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Seguridad
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Mantén tu cuenta segura actualizando tu contraseña regularmente.
              </Typography>
              
              <Button
                variant="contained"
                onClick={() => setOpenPasswordDialog(true)}
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                Cambiar Contraseña
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab Panel 2: Historial de Actividad */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Historial de Actividad Reciente
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="Todas" color="primary" size="small" />
                <Chip label="Cursos" variant="outlined" size="small" />
                <Chip label="Evaluaciones" variant="outlined" size="small" />
              </Box>
            </Box>

            {activityHistory.length > 0 ? (
              <List sx={{ bgcolor: 'background.paper' }}>
                {activityHistory.map((activity, index) => (
                  <React.Fragment key={activity.id || index}>
                    <ListItem 
                      sx={{ 
                        px: 0, 
                        py: 2,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ mr: 2 }}>
                          {activity.type === 'course_completed' && <SchoolIcon color="primary" />}
                          {activity.type === 'module_completed' && <TrendingUpIcon color="secondary" />}
                          {activity.type === 'evaluation_completed' && <CheckCircleIcon color="success" />}
                          {activity.type === 'assignment_completed' && <CheckCircleIcon color="info" />}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                            {activity.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {activity.subtitle}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="text.secondary">
                            {activity.date}
                          </Typography>
                          <Chip 
                            label="Completado" 
                            color="success" 
                            size="small" 
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Box>
                    </ListItem>
                    {index < activityHistory.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No hay actividades registradas aún
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Las actividades aparecerán aquí cuando completes cursos o evaluaciones
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>


      {/* Dialog para cambiar contraseña */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            Cambiar Contraseña
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Para cambiar tu contraseña, ingresa tu contraseña actual y la nueva contraseña.
            </Typography>
            <TextField
              fullWidth
              label="Contraseña Actual"
              type="password"
              variant="outlined"
              value={passwordFormData.currentPassword}
              onChange={(e) => setPasswordFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Nueva Contraseña"
              type="password"
              variant="outlined"
              value={passwordFormData.newPassword}
              onChange={(e) => setPasswordFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirmar Nueva Contraseña"
              type="password"
              variant="outlined"
              value={passwordFormData.confirmPassword}
              onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => {
              setOpenPasswordDialog(false);
              setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            {isSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}