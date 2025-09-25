import { NextRequest, NextResponse } from 'next/server';

// Tipos de datos para la transcripción de videos
interface VideoMetadata {
  title: string;
  description?: string;
  courseId: string;
  courseName: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  duration?: number;
  uploadedAt: string;
}

interface TranscriptionRequest {
  id: string;
  videoMetadata: VideoMetadata;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface TranscriptionResponse {
  success: boolean;
  requestId: string;
  message: string;
  videoMetadata: VideoMetadata;
}

// Configuración de límites
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime'];

/**
 * Validar archivo de video
 */
function validateVideoFile(file: File): { isValid: boolean; error?: string } {
  // Validar tipo de archivo
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Tipo de archivo no soportado. Tipos permitidos: ${ALLOWED_TYPES.join(', ')}`
    };
  }

  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Validar que no esté vacío
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'El archivo está vacío'
    };
  }

  return { isValid: true };
}

/**
 * Extraer metadatos del video (simulado por ahora)
 */
async function extractVideoMetadata(file: File): Promise<Partial<VideoMetadata>> {
  // Por ahora simularemos la extracción de metadatos
  // En el futuro aquí se integraría una librería como ffmpeg para obtener duración real
  
  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    duration: 300, // Simulado: 5 minutos
    uploadedAt: new Date().toISOString()
  };
}

/**
 * Procesar archivo de video para transcripción
 */
async function processVideoForTranscription(
  file: File,
  metadata: VideoMetadata
): Promise<{ success: boolean; message: string; requestId: string }> {
  
  // Simular procesamiento del video
  // Aquí es donde en el futuro se enviará el video al LLM para transcripción
  
  const requestId = `transcribe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('Procesando video para transcripción:', {
    requestId,
    fileName: file.name,
    fileSize: file.size,
    metadata
  });
  
  // Simular delay de procesamiento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: 'Video recibido y encolado para transcripción',
    requestId
  };
}

// POST /api/transcribe-course
export async function POST(request: NextRequest) {
  try {
    // Verificar que el request contiene FormData
    const formData = await request.formData();
    
    // Extraer datos del formulario
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const courseId = formData.get('courseId') as string;
    const courseName = formData.get('courseName') as string;
    const videoFile = formData.get('video') as File;

    // Validar datos requeridos
    if (!title || !courseId || !courseName) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Faltan datos requeridos: título, courseId y courseName son obligatorios' 
        },
        { status: 400 }
      );
    }

    // Validar que se subió un archivo
    if (!videoFile || !(videoFile instanceof File)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No se encontró archivo de video en el formulario' 
        },
        { status: 400 }
      );
    }

    // Validar archivo de video
    const validation = validateVideoFile(videoFile);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: validation.error 
        },
        { status: 400 }
      );
    }

    // Extraer metadatos del video
    const extractedMetadata = await extractVideoMetadata(videoFile);

    // Crear objeto de metadatos completo
    const videoMetadata: VideoMetadata = {
      title: title.trim(),
      description: description?.trim(),
      courseId,
      courseName,
      fileName: extractedMetadata.fileName || videoFile.name,
      fileSize: extractedMetadata.fileSize || videoFile.size,
      fileType: extractedMetadata.fileType || videoFile.type,
      duration: extractedMetadata.duration,
      uploadedAt: extractedMetadata.uploadedAt || new Date().toISOString()
    };

    // Procesar video para transcripción
    const result = await processVideoForTranscription(videoFile, videoMetadata);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al procesar el video para transcripción' 
        },
        { status: 500 }
      );
    }

    // Crear respuesta exitosa
    const response: TranscriptionResponse = {
      success: true,
      requestId: result.requestId,
      message: result.message,
      videoMetadata
    };

    console.log('Video procesado exitosamente:', response);

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error en API transcribe-course:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor al procesar la solicitud de transcripción' 
      },
      { status: 500 }
    );
  }
}

// GET /api/transcribe-course - Para consultar estado de transcripciones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (requestId) {
      // Consultar una transcripción específica
      // Por ahora devolvemos datos simulados
      const mockTranscription: TranscriptionRequest = {
        id: requestId,
        videoMetadata: {
          title: 'Video de ejemplo',
          courseId: 'example-course',
          courseName: 'Curso de Ejemplo',
          fileName: 'example.mp4',
          fileSize: 50000000,
          fileType: 'video/mp4',
          duration: 300,
          uploadedAt: new Date().toISOString()
        },
        status: 'processing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return NextResponse.json(mockTranscription);
    } else {
      // Listar todas las transcripciones (simulado)
      const transcriptions: TranscriptionRequest[] = [];
      return NextResponse.json({ transcriptions });
    }

  } catch (error) {
    console.error('Error al obtener transcripciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener transcripciones' },
      { status: 500 }
    );
  }
}