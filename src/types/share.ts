// Tipos para funcionalidad de compartir cursos
export interface CursoCompartidoData {
  curso: {
    cursoId: string;
    titulo: string;
    descripcion: string | null;
    imagen_portada: string | null;
    nivel_dificultad: string | null;
    duracion_estimada: number | null;
    [key: string]: unknown; // Para propiedades adicionales de Amplify
  };
  compartidoPor: {
    usuarioId: string;
    nombre: string;
    email: string | null;
    [key: string]: unknown; // Para propiedades adicionales de Amplify
  };
  shareCode: string;
  shareUrl: string;
  estado: 'en_progreso' | 'completado' | 'abandonado' | 'inscrito';
  fechaCompartido: string;
}

export interface InscripcionCursoCompartido {
  usuarioId: string;
  cursoId: string;
  codigoCompartido: string;
}

export interface CrearCursoCompartidoData {
  usuarioId: string;
  cursoId: string;
  estado: 'en_progreso' | 'completado' | 'abandonado' | 'inscrito';
}