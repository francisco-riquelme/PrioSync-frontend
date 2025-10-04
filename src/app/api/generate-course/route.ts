import { NextRequest, NextResponse } from 'next/server';
import { generateCourseStructure } from '@/utils/ai/courseStructureGenerator';
import type { 
  CourseGenerationResponse, 
  YouTubePlaylist, 
  CourseCustomization 
} from '@/types/youtube';

// POST /api/generate-course
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parsear el cuerpo de la solicitud
    const body = await request.json();
    const { playlist, customization } = body;

    // Validar datos requeridos
    if (!playlist) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Información de playlist requerida' 
        } as CourseGenerationResponse,
        { status: 400 }
      );
    }

    // Validar estructura de playlist
    if (!playlist.videos || !Array.isArray(playlist.videos) || playlist.videos.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'La playlist debe contener al menos un video' 
        } as CourseGenerationResponse,
        { status: 400 }
      );
    }

    console.log(`Iniciando generación de estructura para playlist: "${playlist.title}"`);
    console.log(`Videos a procesar: ${playlist.videos.length}`);

    // Generar estructura del curso usando IA
    const courseStructure = await generateCourseStructure(
      playlist as YouTubePlaylist,
      customization as CourseCustomization
    );

    const processingTime = Date.now() - startTime;
    
    console.log(`Estructura generada exitosamente en ${processingTime}ms`);
    console.log(`Módulos creados: ${courseStructure.modules.length}`);
    console.log(`Lecciones totales: ${courseStructure.modules.reduce((total, module) => total + module.lessons.length, 0)}`);

    return NextResponse.json({
      success: true,
      data: courseStructure,
      processingTime
    } as CourseGenerationResponse);

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const processingTime = Date.now() - startTime;
    
    console.error('Error al generar estructura de curso:', error);
    
    // Manejar diferentes tipos de errores
    let statusCode = 500;
    let errorMessage = 'Error interno del servidor';

    if (error.message.includes('API key')) {
      statusCode = 503;
      errorMessage = 'Servicio de IA no disponible';
    } else if (error.message.includes('Timeout')) {
      statusCode = 504;
      errorMessage = 'Tiempo de procesamiento agotado';
    } else if (error.message.includes('inválida')) {
      statusCode = 400;
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        processingTime
      } as CourseGenerationResponse,
      { status: statusCode }
    );
  }
}

// GET /api/generate-course?status=health
// Endpoint para verificar el estado del servicio
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const check = searchParams.get('status');

  if (check === 'health') {
    // Verificar que las variables de entorno estén configuradas
    const hasGeminiKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      services: {
        geminiAI: hasGeminiKey ? 'available' : 'not_configured'
      },
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json(
    { 
      success: false, 
      error: 'Endpoint no soportado. Use POST para generar estructura o GET?status=health para verificar estado' 
    },
    { status: 400 }
  );
}