/**
 * Formatea una fecha a formato legible en español
 * Ejemplo: "15 de enero de 2025"
 */
export function formatearFechaAbsoluta(fecha: Date): string {
  const opciones: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  
  return fecha.toLocaleDateString('es-ES', opciones);
}

/**
 * Formatea una fecha a formato corto
 * Ejemplo: "15/01/2025"
 */
export function formatearFechaCorta(fecha: Date): string {
  return fecha.toLocaleDateString('es-ES');
}

/**
 * Formatea una fecha con hora
 * Ejemplo: "15 de enero de 2025, 14:30"
 */
export function formatearFechaConHora(fecha: Date): string {
  const opciones: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return fecha.toLocaleDateString('es-ES', opciones);
}
