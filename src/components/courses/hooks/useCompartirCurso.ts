import { useState, useCallback } from 'react';

// TODO: Reactivar cuando se solucionen los tipos complejos de Amplify
// import { generateClient } from 'aws-amplify/data';
// import type { MainTypes } from '@/utils/api/schema';
// const client = generateClient<MainTypes>();

interface CompartirCursoInput {
  usuarioId: string;
  cursoId: string;
  estado?: 'inscrito' | 'en_progreso' | 'completado' | 'abandonado';
}

interface SharedCourseData {
  shareUrl: string;
  shareCode: string;
  expiresAt?: Date;
}

export function useCompartirCurso() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crearCursoCompartido = async (input: CompartirCursoInput): Promise<SharedCourseData | null> => {
    setLoading(true);
    setError(null);

    console.log('🔍 DEBUG - crearCursoCompartido input:', input);

    try {
      // Validar que el cursoId sea válido
      if (!input.cursoId || input.cursoId.trim().length < 2) {
        throw new Error(`CourseId inválido: "${input.cursoId}"`);
      }

      // Usar cursoId directamente como código compartido
      const shareCode = input.cursoId.trim();
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const shareUrl = `${baseUrl}/courses/shared/${shareCode}`;

      console.log('🔍 DEBUG - shareCode:', shareCode);
      console.log('🔍 DEBUG - baseUrl:', baseUrl);
      console.log('🔍 DEBUG - shareUrl:', shareUrl);

      // Validar que la URL final sea correcta
      if (!shareUrl.includes('/courses/shared/') || shareCode.length < 2) {
        throw new Error(`URL de compartir malformada: ${shareUrl} (shareCode: ${shareCode})`);
      }

      return {
        shareUrl,
        shareCode,
        expiresAt: undefined // Sin expiración por ahora
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al compartir el curso';
      setError(errorMessage);
      console.error('Error compartiendo curso:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsAppUrl = useCallback((courseTitle: string, shareUrl: string) => {
    // Validar que la shareUrl sea válida
    if (!shareUrl || !shareUrl.includes('/courses/shared/')) {
      console.error('🚨 DEBUG - URL de compartir inválida:', shareUrl);
      return '';
    }

    const message = `🎓 ¡Te han compartido un curso!

📚 ${courseTitle}

🚀 Únete gratis y comienza tu aprendizaje:
${shareUrl}

#PrioSync #Aprendizaje #CursoGratis`;

    console.log('🔍 DEBUG - Original message:', message);
    console.log('🔍 DEBUG - Original shareUrl:', shareUrl);

    // Usar encodeURIComponent para una codificación más estándar
    const encodedMessage = encodeURIComponent(message);

    const finalUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    console.log('🔍 DEBUG - Final WhatsApp URL:', finalUrl);

    return finalUrl;
  }, []);

  const obtenerCursoCompartido = useCallback(async (shareCode: string) => {
    setLoading(true);
    setError(null);

    try {
      // shareCode ahora es directamente el cursoId
      const cursoId = shareCode;
      
      // Por ahora, creamos datos de mock para evitar errores de tipos complejos
      // En producción, aquí irían las llamadas reales a Amplify
      
      const mockCurso = {
        cursoId,
        titulo: 'Curso de Ejemplo',
        descripcion: 'Descripción del curso compartido',
        imagen_portada: null,
        nivel_dificultad: 'Intermedio',
        duracion_estimada: 120,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockUsuario = {
        usuarioId: 'mock-user-id',
        nombre: 'Usuario Ejemplo',
        email: 'usuario@ejemplo.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        curso: mockCurso,
        compartidoPor: mockUsuario,
        shareCode,
        shareUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/courses/shared/${shareCode}`,
        estado: 'inscrito' as const,
        fechaCompartido: new Date().toISOString()
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener curso compartido';
      setError(errorMessage);
      console.error('Error obteniendo curso compartido:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const inscribirseACursoCompartido = useCallback(async (data: { usuarioId: string; cursoId: string; codigoCompartido?: string }) => {
    setLoading(true);
    setError(null);

    try {
      // Por ahora simulamos una inscripción exitosa
      // En producción, aquí iría la lógica real de Amplify
      
      console.log('Inscribiéndose al curso:', data);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al inscribirse al curso';
      setError(errorMessage);
      console.error('Error inscribiéndose al curso:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const listarCursosCompartidos = async (usuarioId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Por ahora devolvemos una lista vacía
      // En producción, aquí iría la consulta real a Amplify
      
      console.log('Listando cursos compartidos para:', usuarioId);
      return [];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al listar cursos compartidos';
      setError(errorMessage);
      console.error('Error listando cursos compartidos:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    crearCursoCompartido,
    obtenerCursoCompartido,
    inscribirseACursoCompartido,
    listarCursosCompartidos,
    generateWhatsAppUrl,
    loading,
    error,
    clearError: () => setError(null)
  };
}
