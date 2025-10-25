import { z } from 'zod';

const Recurso = z.object({
  nombre: z.string().optional(),
  titulo: z.string().optional(),
  url: z.string().optional(),
  tipo: z.string().optional(),
});

const Actividad = z.object({
  nombre: z.string().optional(),
  descripcion: z.string().optional(),
  duracionEstimadaMinutos: z.number().optional(),
});

const Pregunta = z.object({
  pregunta: z.string(),
  opciones: z.array(z.string()).optional(),
  respuestaCorrecta: z.string().optional(),
});

const Leccion = z.object({
  titulo: z.string().optional(),
  objetivo: z.string().optional(),
  descripcion: z.string().optional(),
  contenido_explicativo: z.string().optional(),
  duracionMinutos: z.number().optional(),
  ejemplos: z.array(z.string()).optional(),
  actividades: z.array(Actividad).optional(),
  actividadesOpcionales: z.array(Actividad).optional(),
  recursos: z.array(Recurso).optional(),
  recursosOpcionales: z.array(Recurso).optional(),
  miniCuestionario: z.array(Pregunta).optional(),
  miniCuestionarioOpcional: z.array(Pregunta).optional(),
});

export const generatedMaterialSchema = z.object({
  titulo: z.string().optional(),
  descripcion: z.string().optional(),
  modoGeneracion: z.string().optional(),
  generation_status: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  resumen: z.string().optional(),
  duracionEstimadaMinutos: z.number().optional(),
  recursos: z.array(Recurso).optional(),
  secciones: z.array(z.object({ titulo: z.string().optional(), contenido: z.string().optional() })).optional(),
  lecciones: z.array(Leccion).optional(),
  apendice: z.object({
    cuestionario_sugerido: z.array(Pregunta).optional(),
  }).optional(),
  warnings: z.array(z.string()).optional(),
  incluirCuestionario: z.boolean().optional(),
  tocEnabled: z.boolean().optional(),
});

export type GeneratedMaterial = z.infer<typeof generatedMaterialSchema>;

export default generatedMaterialSchema;
