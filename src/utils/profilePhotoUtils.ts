// Utilidades para manejar fotos de perfil

export interface ProfilePhotoData {
  fileName: string;
  dataUrl: string;
  timestamp: number;
}

// Constantes de validación
export const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB en bytes

// Función para validar el tipo de archivo
export const validateImageType = (file: File): boolean => {
  return VALID_IMAGE_TYPES.includes(file.type);
};

// Función para validar el tamaño del archivo
export const validateImageSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE;
};

// Función para formatear el tamaño del archivo
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Función para obtener mensaje de error de validación con información del archivo
export const getDetailedValidationErrorMessage = (file: File): string | null => {
  if (!validateImageType(file)) {
    return `Formato no válido. Solo se permiten archivos JPG y PNG. Formato actual: ${file.type}`;
  }
  
  if (!validateImageSize(file)) {
    return `Archivo demasiado grande. Tamaño actual: ${formatFileSize(file.size)}. Máximo permitido: ${formatFileSize(MAX_FILE_SIZE)}`;
  }
  
  return null;
};

// Función para generar un nombre único para la foto
export const generatePhotoFileName = (userId: string): string => {
  const timestamp = Date.now();
  return `profile_${userId}_${timestamp}.jpg`;
};

// Función para convertir data URL a archivo
export const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// Función para guardar foto en localStorage
export const savePhotoToLocalStorage = (userId: string, dataUrl: string): string => {
  const fileName = generatePhotoFileName(userId);
  const photoData: ProfilePhotoData = {
    fileName,
    dataUrl,
    timestamp: Date.now()
  };
  
  localStorage.setItem(`profile_photo_${userId}`, JSON.stringify(photoData));
  return fileName;
};

// Función para cargar foto desde localStorage
export const loadPhotoFromLocalStorage = (userId: string): string | null => {
  const photoDataStr = localStorage.getItem(`profile_photo_${userId}`);
  if (photoDataStr) {
    try {
      const photoData: ProfilePhotoData = JSON.parse(photoDataStr);
      return photoData.dataUrl;
    } catch (error) {
      console.error('Error parsing photo data:', error);
      return null;
    }
  }
  return null;
};

// Función para eliminar foto del localStorage
export const removePhotoFromLocalStorage = (userId: string): void => {
  localStorage.removeItem(`profile_photo_${userId}`);
};
