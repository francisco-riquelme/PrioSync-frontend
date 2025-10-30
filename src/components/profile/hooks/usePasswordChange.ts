'use client';

import { useState } from 'react';
import { authService } from '@/utils/services/auth';

interface PasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function usePasswordChange() {
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    
    // Validate all fields are filled
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Por favor completa todos los campos');
      return;
    }
    
    // Validate password match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    
    setIsUpdatingPassword(true);
    
    try {
      const result = await authService.updatePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      
      if (result.success) {
        setPasswordSuccess(true);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        return true; // Success
      } else {
        setPasswordError(result.error || 'Error al actualizar contraseña');
        return false;
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Error al actualizar contraseña');
      return false;
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const reset = () => {
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError(null);
    setPasswordSuccess(false);
  };

  return {
    passwordForm,
    setPasswordForm,
    passwordError,
    passwordSuccess,
    isUpdatingPassword,
    handlePasswordChange,
    reset,
  };
}

