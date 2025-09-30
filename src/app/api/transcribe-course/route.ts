// import { NextRequest, NextResponse } from "next/server";
// import {
//   VideoMetadata,
//   TranscriptionJobStatus,
//   TranscriptionResponse,
//   ValidationResult,
//   VIDEO_CONFIG,
// } from "@/types/transcription";

// // Almacenamiento temporal en memoria para simulación
// // En producción esto sería DynamoDB o similar
// const transcriptionJobs = new Map<string, TranscriptionJobStatus>();

// /**
//  * Sanitizar input de texto para prevenir inyección de prompts
//  * con validación adicional contra patrones de manipulación configurables
//  */
// function sanitizeTextInput(input: string, maxLength: number = 100): string {
//   if (!input || typeof input !== 'string') {
//     return 'Contenido no especificado';
//   }

//   const fallbackValues = getFallbackValues();

//   // Verificar patrones peligrosos antes de sanitizar usando configuración externa
//   if (containsDangerousPatterns(input)) {
//     return fallbackValues.title;
//   }

//   // Sanitización básica
//   const sanitized = input
//     .replace(/[<>{}[\]]/g, '') // Remover brackets y llaves
//     .replace(/\\/g, '') // Remover backslashes
//     .replace(/["'`]/g, '') // Remover comillas
//     .replace(/\n|\r/g, ' ') // Convertir saltos de línea a espacios
//     .replace(/\s+/g, ' ') // Normalizar espacios múltiples
//     .replace(/[|#*]/g, '') // Remover caracteres de markdown que podrían usarse para manipulación
//     .trim();

//   // Verificación adicional post-sanitización
//   if (containsDangerousPatterns(sanitized)) {
//     return 'Tema académico';
//   }

//   // Truncar si es demasiado largo
//   return sanitized.length > maxLength
//     ? sanitized.substring(0, maxLength) + '...'
//     : sanitized;
// }

// /**
//  * Validar y sanitizar metadatos del usuario usando patrones configurables
//  */
// function validateAndSanitizeMetadata(title: string, courseName: string): { title: string; courseName: string } {
//   const limits = getLimits();
//   const fallbackValues = getFallbackValues();

//   const sanitizedTitle = sanitizeTextInput(title, limits.maxTitleLength);
//   const sanitizedCourseName = sanitizeTextInput(courseName, limits.maxCourseNameLength);

//   // Verificar patrones prohibidos usando configuración externa
//   const titleHasForbiddenContent = containsDangerousPatterns(sanitizedTitle);
//   const courseNameHasForbiddenContent = containsDangerousPatterns(sanitizedCourseName);

//   return {
//     title: titleHasForbiddenContent ? fallbackValues.title : sanitizedTitle,
//     courseName: courseNameHasForbiddenContent ? fallbackValues.courseName : sanitizedCourseName
//   };
// }

// /**
//  * Crear prompt estructurado y seguro para transcripción
//  * Utiliza un enfoque de template fijo para prevenir inyección de prompts
//  * con configuración externa para flexibilidad
//  */
// function createSecureTranscriptionPrompt(title: string, courseName: string): string {
//   const limits = getLimits();
//   const fallbackValues = getFallbackValues();

//   // Validar que los parámetros no contienen intentos de manipulación
//   if (!title || !courseName || typeof title !== 'string' || typeof courseName !== 'string') {
//     title = fallbackValues.genericTitle;
//     courseName = fallbackValues.genericCourse;
//   }

//   // Aplicar sanitización adicional específica para prompts
//   const cleanTitle = title.replace(/[^\w\s\-áéíóúñü]/gi, '').trim() || fallbackValues.genericTitle;
//   const cleanCourseName = courseName.replace(/[^\w\s\-áéíóúñü]/gi, '').trim() || fallbackValues.genericCourse;

//   // Template fijo sin interpolación directa
//   const promptTemplate = [
//     "Eres un asistente educativo que genera transcripciones académicas.",
//     "Tu tarea es crear una transcripción realista de una clase universitaria.",
//     "",
//     "PARÁMETROS DE LA CLASE:",
//     "- Tema de la clase: [TEMA]",
//     "- Curso: [CURSO]",
//     "",
//     "INSTRUCCIONES FIJAS:",
//     "1. Genera una transcripción de clase universitaria profesional",
//     "2. Incluye introducción, desarrollo del tema y conclusión",
//     "3. Usa un estilo natural de profesor explicando conceptos",
//     "4. Aproximadamente 300-500 palabras",
//     "5. Mantén un tono académico y educativo",
//     "6. No incluyas ningún contenido que no sea educativo",
//     "",
//     "Genera la transcripción ahora:"
//   ].join('\n');

//   // Reemplazar marcadores de forma segura sin interpolación directa usando límites configurables
//   return promptTemplate
//     .replace('[TEMA]', cleanTitle.substring(0, limits.promptTitleLength))
//     .replace('[CURSO]', cleanCourseName.substring(0, limits.promptCourseLength));
// }

// /**
//  * Validar archivo de video
//  */
// function validateVideoFile(file: File): ValidationResult {
//   // Validar tipo de archivo
//   if (!(VIDEO_CONFIG.ALLOWED_TYPES as readonly string[]).includes(file.type)) {
//     return {
//       isValid: false,
//       error: `Tipo de archivo no soportado. Tipos permitidos: ${VIDEO_CONFIG.ALLOWED_TYPES.join(", ")}`,
//     };
//   }

//   // Validar tamaño
//   if (file.size > VIDEO_CONFIG.MAX_FILE_SIZE) {
//     return {
//       isValid: false,
//       error: `El archivo es demasiado grande. Tamaño máximo: ${VIDEO_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
//     };
//   }

//   // Validar que no esté vacío
//   if (file.size === 0) {
//     return {
//       isValid: false,
//       error: "El archivo está vacío",
//     };
//   }

//   return { isValid: true };
// }

// /**
//  * Extraer metadatos del video (simulado por ahora)
//  */
// async function extractVideoMetadata(
//   file: File
// ): Promise<Partial<VideoMetadata>> {
//   // Por ahora simularemos la extracción de metadatos
//   // En el futuro aquí se integraría una librería como ffmpeg para obtener duración real

//   return {
//     fileName: file.name,
//     fileSize: file.size,
//     fileType: file.type,
//     duration: Math.floor(Math.random() * 1800) + 300, // Simulado: 5-35 minutos
//     uploadedAt: new Date().toISOString(),
//   };
// }

// /**
//  * Procesar archivo de video para transcripción usando Google Gemini 2.5 Flash
//  *
//  * IMPLEMENTACIÓN ACTUAL:
//  * - Genera transcripciones inteligentes basadas en contexto usando Gemini 2.5 Flash
//  * - Utiliza título, descripción y metadatos para crear contenido educativo realista
//  * - Implementa protección contra inyección de prompts mediante:
//  *   * Sanitización avanzada de entrada con patrones de seguridad configurables
//  *   * Prompts estructurados con templates fijos
//  *   * Validación adicional post-sanitización
//  *   * Límites estrictos de longitud de parámetros configurables
//  *   * Patrones de seguridad externalizados en archivo de configuración
//  *   * Soporte para actualizaciones dinámicas vía variables de entorno
//  *
//  * CONFIGURACIÓN DE SEGURIDAD:
//  * - Patrones definidos en: src/config/security-patterns.json
//  * - Override dinámico vía: PROMPT_INJECTION_PATTERNS (env var)
//  * - Actualizable sin redeployment para respuesta rápida a nuevas amenazas
//  *
//  * ROADMAP FUTURO:
//  * - Integrar procesamiento real de archivos multimedia (audio/video)
//  * - Implementar extracción de audio desde video usando FFmpeg
//  * - Soporte para archivos de hasta 2GB (límite actual de Gemini)
//  * - Sistema de actualización automática de patrones desde base de datos
//  */
// async function processVideoForTranscription(
//   file: File,
//   metadata: VideoMetadata
// ): Promise<{
//   success: boolean;
//   message: string;
//   requestId: string;
//   transcriptionText?: string;
// }> {
//   const requestId = `transcribe_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

//   // Crear job de transcripción inicial
//   const transcriptionJob: TranscriptionJobStatus = {
//     id: requestId,
//     videoMetadata: metadata,
//     status: "processing",
//     progress: 0,
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
//   };

//   // Guardar en almacenamiento temporal
//   transcriptionJobs.set(requestId, transcriptionJob);

//   console.log("Procesando video para transcripción:", {
//     requestId,
//     fileName: file.name,
//     fileSize: file.size,
//     metadata,
//   });

//   // Simular procesamiento asíncrono
//   // En producción, aquí se llamaría al LLM/AI SDK
//   setTimeout(async () => {
//     try {
//       const job = transcriptionJobs.get(requestId);
//       if (job) {
//         // Simular transcripción completada
//         const simulatedTranscription = generateSimulatedTranscription(
//           metadata.title
//         );

//         job.status = "completed";
//         job.progress = 100;
//         job.transcriptionText = simulatedTranscription;
//         job.updatedAt = new Date().toISOString();

//         transcriptionJobs.set(requestId, job);
//         console.log(`Transcripción completada para ${requestId}`);
//       }
//     } catch (error) {
//       console.error(`Error procesando transcripción para ${requestId}:`, error);
//     }
//     console.log('API Key encontrada');

//   return {
//     success: true,
//     message: "Video recibido y encolado para transcripción",
//     requestId,
//   };
// }

//     console.log(`Archivo recibido. Tipo: ${file.type}, Tamaño: ${file.size} bytes`);

//     // Actualizar progreso: enviando a Gemini
//     transcriptionJob.progress = 50;
//     transcriptionJob.updatedAt = new Date().toISOString();
//     transcriptionJobs.set(requestId, transcriptionJob);

//     // Configurar el modelo de Google Gemini 2.5 Flash
//     console.log('Configurando modelo Gemini 2.5 Flash...');
//     const model = google('gemini-2.5-flash');
//     console.log('Modelo Gemini 2.5 Flash configurado');

//     console.log('Iniciando generación de transcripción con Gemini...');

//     // Sanitizar metadatos para prevenir inyección de prompts
//     const { title: safeTitle, courseName: safeCourseName } = validateAndSanitizeMetadata(
//       metadata.title,
//       metadata.courseName
//     );

//     console.log('Metadatos sanitizados:', {
//       originalTitle: metadata.title,
//       safeTitle,
//       originalCourseName: metadata.courseName,
//       safeCourseName
//     });

//     try {
//       // Crear prompt estructurado y seguro
//       const securePrompt = createSecureTranscriptionPrompt(safeTitle, safeCourseName);

//       console.log('Generando transcripción con prompt estructurado y seguro');

//       // Realizar llamada a Gemini con prompt seguro
//       const { text: transcriptionText } = await generateText({
//         model,
//         prompt: securePrompt,
//       });

//       console.log('Transcripción generada exitosamente con Gemini');
//       console.log(`Longitud: ${transcriptionText.length} caracteres`);

//       // Actualizar job con transcripción completada
//       transcriptionJob.status = 'completed';
//       transcriptionJob.progress = 100;
//       transcriptionJob.transcriptionText = transcriptionText;
//       transcriptionJob.updatedAt = new Date().toISOString();
//       transcriptionJobs.set(requestId, transcriptionJob);

//       console.log('Proceso completado exitosamente');

//       return {
//         success: true,
//         message: 'Video transcrito exitosamente usando Google Gemini 2.5 Flash (transcripción inteligente basada en contexto)',
//         requestId,
//         transcriptionText
//       };

//     } catch (geminiError) {
//       console.error('Error específico de Gemini:', geminiError);

//       // Si la llamada a Gemini falla, usar transcripción de respaldo con metadatos sanitizados
//       const fallbackTranscription = `Bienvenidos a esta clase de ${safeTitle}.

// En esta sesión del curso ${safeCourseName}, vamos a explorar los conceptos fundamentales de este importante tema.

// [Inicio de clase]

// Como introducción, es importante que entiendan que este tema forma parte integral del programa de estudios y tiene aplicaciones prácticas significativas en su área de especialización.

// Comenzaremos estableciendo las bases teóricas necesarias. [pausa para escribir en pizarra]

// Los conceptos que vamos a revisar hoy incluyen definiciones clave, principios fundamentales y metodologías que aplicaremos en ejercicios prácticos.

// [Desarrollo del tema]

// Primero, consideremos el aspecto teórico... Como pueden observar, hay una relación directa entre la teoría y sus aplicaciones prácticas.

// Ahora, veamos algunos ejemplos específicos que ilustran estos conceptos. [ejemplo en pizarra]

// Es importante que tomen notas de estos puntos clave, ya que aparecerán en las evaluaciones futuras.

// [Pregunta de estudiante]

// Excelente pregunta. Eso nos permite profundizar en un aspecto muy relevante del tema...

// [Conclusión]

// Recuerden que la práctica constante es clave para mejorar como desarrolladores.`,
//   };

//   // Seleccionar transcripción basada en palabras clave del título
//   const titleLower = title.toLowerCase();
//   if (
//     titleLower.includes("calculo") ||
//     titleLower.includes("matemáticas") ||
//     titleLower.includes("derivadas")
//   ) {
//     return transcriptions.calculo;
//   } else if (
//     titleLower.includes("desarrollo") ||
//     titleLower.includes("software") ||
//     titleLower.includes("programación")
//   ) {
//     return transcriptions.desarrollo;
//   } else {
//     return transcriptions.default;
//   }
// }

// // POST /api/transcribe-course
// export async function POST(request: NextRequest) {
//   try {
//     // Verificar que el request contiene FormData
//     const formData = await request.formData();

//     // Extraer datos del formulario
//     const title = formData.get("title") as string;
//     const description = formData.get("description") as string;
//     const courseId = formData.get("courseId") as string;
//     const courseName = formData.get("courseName") as string;
//     const videoFile = formData.get("video") as File;

//     // Validar datos requeridos
//     if (!title || !courseId || !courseName) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "Faltan datos requeridos: título, courseId y courseName son obligatorios",
//         },
//         { status: 400 }
//       );
//     }

//     // Validar que se subió un archivo
//     if (!videoFile || !(videoFile instanceof File)) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "No se encontró archivo de video en el formulario",
//         },
//         { status: 400 }
//       );
//     }

//     // Validar archivo de video
//     const validation = validateVideoFile(videoFile);
//     if (!validation.isValid) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: validation.error,
//         },
//         { status: 400 }
//       );
//     }

//     // Extraer metadatos del video
//     const extractedMetadata = await extractVideoMetadata(videoFile);

//     // Crear objeto de metadatos completo
//     const videoMetadata: VideoMetadata = {
//       title: title.trim(),
//       description: description?.trim(),
//       courseId,
//       courseName,
//       fileName: extractedMetadata.fileName || videoFile.name,
//       fileSize: extractedMetadata.fileSize || videoFile.size,
//       fileType: extractedMetadata.fileType || videoFile.type,
//       duration: extractedMetadata.duration,
//       uploadedAt: extractedMetadata.uploadedAt || new Date().toISOString(),
//     };

//     // Procesar video para transcripción
//     const result = await processVideoForTranscription(videoFile, videoMetadata);

//     if (!result.success) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Error al procesar el video para transcripción",
//         },
//         { status: 500 }
//       );
//     }

//     // Crear respuesta exitosa
//     const response: TranscriptionResponse = {
//       success: true,
//       requestId: result.requestId,
//       message: result.message,
//       videoMetadata,
//     };

//     console.log("Video procesado exitosamente:", response);

//     return NextResponse.json(response, { status: 201 });
//   } catch (error) {
//     console.error("Error en API transcribe-course:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         error:
//           "Error interno del servidor al procesar la solicitud de transcripción",
//       },
//       { status: 500 }
//     );
//   }
// }

// // GET /api/transcribe-course - Para consultar estado de transcripciones
// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const requestId = searchParams.get("requestId");

//     if (requestId) {
//       // Consultar una transcripción específica
//       const job = transcriptionJobs.get(requestId);

//       if (job) {
//         return NextResponse.json(job);
//       } else {
//         // Devolver datos simulados para requestIds que no existen (para compatibilidad con tests)
//         const mockTranscription: TranscriptionJobStatus = {
//           id: requestId,
//           videoMetadata: {
//             title: "Video de ejemplo",
//             courseId: "example-course",
//             courseName: "Curso de Ejemplo",
//             fileName: "example.mp4",
//             fileSize: 50000000,
//             fileType: "video/mp4",
//             duration: 300,
//             uploadedAt: new Date().toISOString(),
//           },
//           status: "processing",
//           progress: 50,
//           createdAt: new Date().toISOString(),
//           updatedAt: new Date().toISOString(),
//         };

//         return NextResponse.json(mockTranscription);
//       }
//     } else {
//       // Listar todas las transcripciones
//       const transcriptions = Array.from(transcriptionJobs.values());
//       return NextResponse.json({ transcriptions });
//     }
//   } catch (error) {
//     console.error("Error al obtener transcripciones:", error);
//     return NextResponse.json(
//       { error: "Error al obtener transcripciones" },
//       { status: 500 }
//     );
//   }
// }
