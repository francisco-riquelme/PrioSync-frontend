/**
 * Configuración de Registro de Usuarios
 * 
 * Para deshabilitar el registro de nuevos usuarios, cambia ENABLE_REGISTRATION a false.
 * Esto es útil para evitar que usuarios no autorizados se registren y agoten recursos (tokens LLM, etc.)
 * 
 * IMPORTANTE: Cuando ENABLE_REGISTRATION está en false:
 * - La página /auth/register mostrará un mensaje de que el registro está deshabilitado
 * - Los enlaces de "Crear cuenta" estarán ocultos o deshabilitados
 * - El modal de registro en la landing page estará deshabilitado
 */

// CAMBIA ESTE VALOR PARA HABILITAR/DESHABILITAR EL REGISTRO
export const ENABLE_REGISTRATION = false; // Cambia a true para habilitar el registro

// Mensaje que se mostrará cuando el registro esté deshabilitado
export const REGISTRATION_DISABLED_MESSAGE = 
  'El registro de nuevos usuarios está temporalmente deshabilitado. Por favor, contacta al administrador si necesitas acceso.';

