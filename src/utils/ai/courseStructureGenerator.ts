import { GoogleGenerativeAI } from '@google/generative-ai';
import type { 
  YouTubePlaylist, 
  GeneratedCourseStructure, 
  CourseModule, 
  CourseLesson,
  CourseCustomization 
} from '@/types/youtube';

// Interfaz para el resultado de Gemini
interface GeminiResponse {
  response: {
    text(): string;
  };
}

// Configuración para el generador
const COURSE_GENERATION_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,
  timeout: 90000,
  model: 'gemini-2.5-flash-lite'
} as const;

// Función para extraer JSON de respuesta de LLM con múltiples patrones
function extractJSON(response: string): GeneratedCourseStructure {
  // Patrones para encontrar JSON en la respuesta
  const patterns = [
    /```json\s*([\s\S]*?)\s*```/,
    /```\s*([\s\S]*?)\s*```/,
    /\{[\s\S]*\}/,
    /"courseStructure"\s*:\s*(\{[\s\S]*\})/
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) {
      try {
        const jsonStr = match[1] || match[0];
        const parsed = JSON.parse(jsonStr.trim());
        
        // Validar que el objeto tiene la estructura esperada
        if (parsed && typeof parsed === 'object' && 'title' in parsed && 'modules' in parsed) {
          return parsed as GeneratedCourseStructure;
        }
      } catch (error) {
        console.warn(`Patrón ${pattern} no pudo parsear JSON:`, error);
      }
    }
  }

  throw new Error('No se pudo extraer JSON válido de la respuesta');
}

// Función para generar estructura de curso usando Gemini
export async function generateCourseStructure(
  playlist: YouTubePlaylist,
  customization?: CourseCustomization
): Promise<GeneratedCourseStructure> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Generative AI API key no configurada');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Preparar información de videos para el prompt
  const videosInfo = playlist.videos.map(video => ({
    title: video.title,
    description: video.description,
    duration: video.duration,
    position: video.position
  }));

  // Crear prompt estructurado para generar la estructura del curso
  const prompt = `Eres un experto diseñador instruccional. Tu tarea es analizar una playlist de YouTube y crear una estructura de curso educativo completa y bien organizada.

INFORMACIÓN DE LA PLAYLIST:
- Título: ${playlist.title}
- Descripción: ${playlist.description}
- Canal: ${playlist.channelTitle}
- Cantidad de videos: ${playlist.itemCount}

VIDEOS EN LA PLAYLIST:
${videosInfo.map(video => `
- Posición ${video.position + 1}: "${video.title}"
  Duración: ${video.duration}
  Descripción: ${video.description.substring(0, 200)}...
`).join('')}

PERSONALIZACIÓN SOLICITADA:
${customization ? `
- Título personalizado: ${customization.title || 'No especificado'}
- Descripción personalizada: ${customization.description || 'No especificada'}
- Categoría: ${customization.category || 'No especificada'}
- Nivel: ${customization.level || 'No especificado'}
- Instructor: ${customization.instructor || 'No especificado'}
- Audiencia objetivo: ${customization.targetAudience || 'No especificada'}
` : 'Sin personalización específica'}

INSTRUCCIONES:
1. Analiza el contenido y temática de los videos
2. Organiza los videos en módulos lógicos y coherentes (máximo 6 módulos)
3. Crea títulos descriptivos para cada módulo
4. Asigna cada video a un módulo como una lección
5. Genera objetivos de aprendizaje para cada lección
6. Identifica temas clave para cada lección
7. Crea una descripción general del curso
8. Sugiere el nivel de dificultad apropiado
9. Calcula la duración total estimada
10. Genera tags relevantes

FORMATO DE RESPUESTA (JSON estricto):
{
  "title": "Título del curso basado en el contenido",
  "description": "Descripción completa del curso (200-300 palabras)",
  "category": "Categoría apropiada",
  "level": "beginner|intermediate|advanced",
  "estimatedDuration": "Duración total (ej: 4h 30m)",
  "instructor": "Nombre del instructor",
  "objectives": [
    "Objetivo general 1",
    "Objetivo general 2",
    "Objetivo general 3"
  ],
  "modules": [
    {
      "id": "modulo-1",
      "title": "Título del Módulo",
      "description": "Descripción del módulo",
      "order": 1,
      "estimatedDuration": "Duración del módulo",
      "lessons": [
        {
          "id": "leccion-1",
          "title": "Título de la lección",
          "description": "Descripción de la lección",
          "order": 1,
          "youtubeVideoId": "ID_del_video_YouTube",
          "duration": "Duración del video",
          "objectives": ["Objetivo específico 1", "Objetivo específico 2"],
          "keyTopics": ["Tema clave 1", "Tema clave 2"]
        }
      ]
    }
  ],
  "tags": ["tag1", "tag2", "tag3"],
  "prerequisites": ["Prerrequisito 1", "Prerrequisito 2"],
  "targetAudience": "Descripción de la audiencia objetivo"
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON válido, sin texto adicional antes o después.`;

  console.log('Generando estructura de curso con Gemini...');

  for (let attempt = 1; attempt <= COURSE_GENERATION_CONFIG.maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: COURSE_GENERATION_CONFIG.model 
      });

      // Generar contenido con timeout
      const generatePromise = model.generateContent(prompt);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en generación')), COURSE_GENERATION_CONFIG.timeout)
      );

      const result = await Promise.race([generatePromise, timeoutPromise]);
      
      // Verificar que el resultado es del tipo esperado y typearlo
      if (!result || typeof result !== 'object' || !('response' in result)) {
        throw new Error('Respuesta inválida del modelo');
      }
      
      const geminiResult = result as GeminiResponse;
      const response = geminiResult.response.text();

      console.log('Respuesta de Gemini recibida, procesando...');

      // Extraer y parsear JSON
      const courseData = extractJSON(response);

      // Validar estructura básica
      if (!courseData.title || !courseData.modules || !Array.isArray(courseData.modules)) {
        throw new Error('Estructura de curso inválida');
      }

      // Mapear videos a lecciones asegurando IDs correctos
      courseData.modules.forEach((module: CourseModule, moduleIndex: number) => {
        module.lessons?.forEach((lesson: CourseLesson, lessonIndex: number) => {
          // Buscar el video correspondiente por posición o título
          const matchingVideo = playlist.videos.find(video => 
            video.title.toLowerCase().includes(lesson.title.toLowerCase()) ||
            video.position === lessonIndex
          );

          if (matchingVideo) {
            lesson.youtubeVideoId = matchingVideo.id;
            lesson.duration = matchingVideo.duration;
          } else {
            // Fallback: usar el video en la posición correspondiente
            const videoIndex = moduleIndex * 3 + lessonIndex; // Estimación simple
            const fallbackVideo = playlist.videos[videoIndex];
            if (fallbackVideo) {
              lesson.youtubeVideoId = fallbackVideo.id;
              lesson.duration = fallbackVideo.duration;
            }
          }
        });
      });

      console.log('Estructura de curso generada exitosamente');
      return courseData as GeneratedCourseStructure;

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.warn(`Intento ${attempt} falló:`, error.message);
      
      if (attempt === COURSE_GENERATION_CONFIG.maxRetries) {
        console.error('Todos los intentos fallaron, generando estructura de fallback');
        return generateFallbackStructure(playlist, customization);
      }

      // Esperar antes del siguiente intento
      await new Promise(resolve => 
        setTimeout(resolve, COURSE_GENERATION_CONFIG.retryDelay * attempt)
      );
    }
  }

  throw new Error('Error inesperado en la generación de estructura');
}

// Función de fallback para generar estructura básica cuando falla la IA
function generateFallbackStructure(
  playlist: YouTubePlaylist,
  customization?: CourseCustomization
): GeneratedCourseStructure {
  console.log('Generando estructura de fallback...');

  // Dividir videos en módulos (máximo 6 videos por módulo)
  const videosPerModule = Math.ceil(playlist.videos.length / Math.min(6, Math.ceil(playlist.videos.length / 6)));
  const modules: CourseModule[] = [];

  for (let i = 0; i < playlist.videos.length; i += videosPerModule) {
    const moduleVideos = playlist.videos.slice(i, i + videosPerModule);
    const moduleNumber = Math.floor(i / videosPerModule) + 1;

    const lessons: CourseLesson[] = moduleVideos.map((video, index) => ({
      id: `leccion-${moduleNumber}-${index + 1}`,
      title: video.title,
      description: video.description || `Lección basada en: ${video.title}`,
      order: index + 1,
      youtubeVideoId: video.id,
      duration: video.duration,
      objectives: [`Entender los conceptos de: ${video.title}`],
      keyTopics: [`Tema principal: ${video.title.split(' ').slice(0, 3).join(' ')}`]
    }));

    // Calcular duración total del módulo
    const totalSeconds = moduleVideos.reduce((total, video) => {
      const [minutes, seconds] = video.duration.split(':').map(Number);
      return total + (minutes * 60) + (seconds || 0);
    }, 0);
    
    const moduleHours = Math.floor(totalSeconds / 3600);
    const moduleMinutes = Math.floor((totalSeconds % 3600) / 60);
    const estimatedDuration = moduleHours > 0 
      ? `${moduleHours}h ${moduleMinutes}m`
      : `${moduleMinutes}m`;

    modules.push({
      id: `modulo-${moduleNumber}`,
      title: `Módulo ${moduleNumber}: ${playlist.title.split(' ').slice(0, 3).join(' ')}`,
      description: `Módulo ${moduleNumber} del curso basado en la playlist: ${playlist.title}`,
      order: moduleNumber,
      lessons,
      estimatedDuration
    });
  }

  // Calcular duración total del curso
  const totalCourseSeconds = playlist.videos.reduce((total, video) => {
    const [minutes, seconds] = video.duration.split(':').map(Number);
    return total + (minutes * 60) + (seconds || 0);
  }, 0);
  
  const courseHours = Math.floor(totalCourseSeconds / 3600);
  const courseMinutes = Math.floor((totalCourseSeconds % 3600) / 60);
  const totalDuration = courseHours > 0 
    ? `${courseHours}h ${courseMinutes}m`
    : `${courseMinutes}m`;

  return {
    title: customization?.title || playlist.title,
    description: customization?.description || `Curso basado en la playlist "${playlist.title}" del canal ${playlist.channelTitle}. Este curso cubre los temas principales presentados en ${playlist.itemCount} lecciones estructuradas.`,
    category: customization?.category || 'General',
    level: customization?.level || 'intermediate',
    estimatedDuration: totalDuration,
    instructor: customization?.instructor || playlist.channelTitle,
    objectives: customization?.customObjectives || [
      `Dominar los conceptos presentados en ${playlist.title}`,
      'Aplicar los conocimientos adquiridos en proyectos prácticos',
      'Desarrollar habilidades fundamentales en el tema'
    ],
    modules,
    tags: customization?.customTags || ['curso online', 'video tutorial', playlist.channelTitle.toLowerCase()],
    prerequisites: ['Conocimientos básicos en el área', 'Acceso a internet'],
    targetAudience: customization?.targetAudience || 'Estudiantes y profesionales interesados en el tema'
  };
}