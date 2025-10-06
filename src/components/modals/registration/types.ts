import { WelcomeFormData } from "../welcome/types";

export interface RegistrationFormFields {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegistrationFormData {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  password: string;
  confirmPassword: string;
  welcomeData?: WelcomeFormData;
}

// Configuración de validación
export const VALIDATION_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REQUIRED: true,
  PASSWORD_REQUIRED: true,
} as const;

// Mensajes de error
export const ERROR_MESSAGES = {
  INVALID_NAME: "Por favor ingresa tu nombre",
  INVALID_LASTNAME: "Por favor ingresa tu apellido",
  INVALID_PHONE:
    "Por favor ingresa un número de teléfono chileno válido (ej: +56912345678)",
  INVALID_EMAIL: "Por favor ingresa un correo electrónico válido",
  PASSWORD_TOO_SHORT: `La contraseña debe tener al menos ${VALIDATION_CONFIG.PASSWORD_MIN_LENGTH} caracteres`,
  PASSWORD_WEAK:
    "La contraseña debe contener al menos una letra mayúscula, una minúscula y un número",
  PASSWORDS_DONT_MATCH: "Las contraseñas no coinciden",
  REGISTRATION_FAILED: "Error al crear la cuenta. Inténtalo de nuevo.",
} as const;

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (
  password: string
): { isValid: boolean; message?: string } => {
  if (password.length < VALIDATION_CONFIG.PASSWORD_MIN_LENGTH) {
    return {
      isValid: false,
      message: ERROR_MESSAGES.PASSWORD_TOO_SHORT,
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return {
      isValid: false,
      message: ERROR_MESSAGES.PASSWORD_WEAK,
    };
  }

  return { isValid: true };
};

export const validateChileanPhone = (phone: string): boolean => {
  // Formato: +56912345678 (móvil chileno)
  const phoneRegex = /^\+569[0-9]{8}$/;
  return phoneRegex.test(phone);
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};
