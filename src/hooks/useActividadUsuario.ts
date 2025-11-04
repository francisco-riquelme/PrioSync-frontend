'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getQueryFactories } from '@/utils/commons/queries';
import type { MainTypes } from '@/utils/api/schema';

export interface ActividadUsuario {
  id: string;
  tipo: 'leccion' | 'quiz' | 'sesion' | 'curso-completado';
  titulo: string;
  subtitulo: string;
  fecha: Date;
  cursoId?: string; // ID del curso asociado
  cursoNombre?: string; // Nombre del curso asociado
  metadata?: {
    puntaje?: number;
    aprobado?: boolean;
    duracion?: number;
    progreso?: number;
    estado?: string;
  };
}

export interface ActividadPorCurso {
  cursoId: string;
  cursoNombre: string;
  actividades: ActividadUsuario[];
  fechaMasReciente: Date; // Para ordenamiento
}

export function useActividadUsuario() {
  const { userData } = useUser();
  const [actividades, setActividades] = useState<ActividadUsuario[]>([]);
  const [actividadesPorCurso, setActividadesPorCurso] = useState<ActividadPorCurso[]>([]);
  const [actividadesSinCurso, setActividadesSinCurso] = useState<ActividadUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActividades() {
      if (!userData?.usuarioId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { ProgresoLeccion, ProgresoCuestionario, SesionEstudio } = await getQueryFactories<
          Pick<MainTypes, 'ProgresoLeccion' | 'ProgresoCuestionario' | 'SesionEstudio'>,
          'ProgresoLeccion' | 'ProgresoCuestionario' | 'SesionEstudio'
        >({
          entities: ['ProgresoLeccion', 'ProgresoCuestionario', 'SesionEstudio'],
        });
        const allActividades: ActividadUsuario[] = [];

        // 1. Fetch lecciones completadas
        const leccionesResult = await ProgresoLeccion.list({
          filter: {
            and: [
              { usuarioId: { eq: userData.usuarioId } },
              { completada: { eq: true } },
            ],
          },
          selectionSet: [
            'usuarioId',
            'leccionId',
            'completada',
            'fecha_completado',
            'Leccion.leccionId',
            'Leccion.titulo',
            'Leccion.moduloId',
            'Leccion.Modulo.moduloId',
            'Leccion.Modulo.titulo',
            'Leccion.Modulo.cursoId',
            'Leccion.Modulo.Curso.cursoId',
            'Leccion.Modulo.Curso.titulo',
          ],
        });

        if (leccionesResult.items) {
          for (const progreso of leccionesResult.items) {
            if (progreso.fecha_completado) {
              const leccion = progreso.Leccion as unknown as {
                titulo: string;
                Modulo?: {
                  titulo?: string;
                  cursoId?: string;
                  Curso?: { titulo?: string } | null;
                } | null;
              };
              const tituloLeccion = leccion?.titulo || 'Lección completada';
              const tituloCurso = leccion?.Modulo?.Curso?.titulo || 'Sin curso';
              
              allActividades.push({
                id: `leccion-${progreso.leccionId}`,
                tipo: 'leccion',
                titulo: `Completaste: ${tituloLeccion}`,
                subtitulo: `Curso: ${tituloCurso}`,
                fecha: new Date(progreso.fecha_completado),
                cursoId: leccion?.Modulo?.cursoId,
                cursoNombre: tituloCurso,
              });
            }
          }
        }

        // 2. Fetch quizzes completados
        const quizzesResult = await ProgresoCuestionario.list({
          filter: {
            usuarioId: { eq: userData.usuarioId },
          },
          selectionSet: [
            'progresoCuestionarioId',
            'puntaje_obtenido',
            'aprobado',
            'fecha_completado',
            'intento_numero',
            'usuarioId',
            'cuestionarioId',
            'Cuestionario.cuestionarioId',
            'Cuestionario.titulo',
            'Cuestionario.tipo',
            'Cuestionario.puntos_maximos',
            'Cuestionario.cursoId',
            'Cuestionario.Curso.cursoId',
            'Cuestionario.Curso.titulo',
          ],
        });

        if (quizzesResult.items) {
          for (const progreso of quizzesResult.items) {
            if (progreso.fecha_completado) {
              const cuestionario = progreso.Cuestionario as unknown as {
                titulo: string;
                tipo?: string | null;
                puntos_maximos?: number | null;
                cursoId?: string;
                Curso?: { titulo?: string } | null;
              };
              
              const puntaje = progreso.puntaje_obtenido || 0;
              const puntajeMaximo = cuestionario?.puntos_maximos || 100;
              const porcentaje = Math.round((puntaje / puntajeMaximo) * 100);
              const tipoQuiz = cuestionario?.tipo || 'EVALUACION';
              const tituloQuiz = cuestionario?.titulo || 'Cuestionario';
              const tituloCurso = cuestionario?.Curso?.titulo || 'Sin curso';

              allActividades.push({
                id: `quiz-${progreso.progresoCuestionarioId}`,
                tipo: 'quiz',
                titulo: `${tipoQuiz}: ${tituloQuiz}`,
                subtitulo: `Curso: ${tituloCurso} • Puntaje: ${porcentaje}%`,
                fecha: new Date(progreso.fecha_completado),
                cursoId: cuestionario?.cursoId,
                cursoNombre: tituloCurso,
                metadata: {
                  puntaje: porcentaje,
                  aprobado: progreso.aprobado || false,
                },
              });
            }
          }
        }

        // 3. Fetch sesiones de estudio (completadas y pendientes)
        const sesionesResult = await SesionEstudio.list({
          filter: {
            usuarioId: { eq: userData.usuarioId },
          },
          selectionSet: [
            'sesionEstudioId',
            'fecha',
            'hora_inicio',
            'hora_fin',
            'duracion_minutos',
            'tipo',
            'estado',
            'usuarioId',
            'cursoId',
            'leccionId',
            'Curso.cursoId',
            'Curso.titulo',
            'Leccion.leccionId',
            'Leccion.titulo',
          ],
        });

        if (sesionesResult.items) {
          for (const sesion of sesionesResult.items) {
            if (sesion.fecha) {
              const leccion = sesion.Leccion as unknown as { titulo?: string } | null;
              const curso = sesion.Curso as unknown as { titulo?: string; cursoId?: string } | null;
              
              const nombreSesion = leccion?.titulo || curso?.titulo || 'Sesión de estudio';
              const duracion = sesion.duracion_minutos || 0;
              const estado = sesion.estado || 'PENDIENTE';
              const tipo = sesion.tipo || 'OTRO';

              // Determinar el título según el estado (estados en minúsculas)
              let titulo = '';
              if (estado === 'completada') {
                titulo = `Sesión completada: ${nombreSesion}`;
              } else if (estado === 'cancelada') {
                titulo = `Sesión cancelada: ${nombreSesion}`;
              } else {
                titulo = `Sesión programada: ${nombreSesion}`;
              }

              let subtitulo = '';
              const tituloCurso = curso?.titulo;
              if (tituloCurso) {
                subtitulo = `Curso: ${tituloCurso}`;
              }
              if (duracion > 0) {
                subtitulo += subtitulo ? ` • ${duracion} min` : `${duracion} min`;
              }
              if (tipo !== 'OTRO') {
                subtitulo += subtitulo ? ` • ${tipo}` : tipo;
              }

              allActividades.push({
                id: `sesion-${sesion.sesionEstudioId}`,
                tipo: 'sesion',
                titulo,
                subtitulo: subtitulo || 'Sesión de estudio',
                fecha: new Date(sesion.fecha),
                cursoId: curso?.cursoId,
                cursoNombre: tituloCurso || 'Sin curso',
                metadata: {
                  duracion,
                  estado,
                },
              });
            }
          }
        }

        // Ordenar por fecha descendente (más reciente primero)
        allActividades.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

        setActividades(allActividades);

        // Agrupar actividades por curso
        const cursosMap = new Map<string, ActividadPorCurso>();
        const sinCurso: ActividadUsuario[] = [];

        for (const actividad of allActividades) {
          // Si no tiene cursoId o el cursoNombre es "Sin curso", va a sinCurso
          if (!actividad.cursoId || actividad.cursoNombre === 'Sin curso') {
            sinCurso.push(actividad);
            continue;
          }

          if (!cursosMap.has(actividad.cursoId)) {
            cursosMap.set(actividad.cursoId, {
              cursoId: actividad.cursoId,
              cursoNombre: actividad.cursoNombre || 'Curso sin nombre',
              actividades: [],
              fechaMasReciente: actividad.fecha,
            });
          }

          const cursoData = cursosMap.get(actividad.cursoId)!;
          cursoData.actividades.push(actividad);

          // Actualizar fecha más reciente si es necesario
          if (actividad.fecha > cursoData.fechaMasReciente) {
            cursoData.fechaMasReciente = actividad.fecha;
          }
        }

        // Convertir a array y ordenar por fecha más reciente
        const cursosArray = Array.from(cursosMap.values()).sort(
          (a, b) => b.fechaMasReciente.getTime() - a.fechaMasReciente.getTime()
        );

        setActividadesPorCurso(cursosArray);
        setActividadesSinCurso(sinCurso);
        setError(null);
      } catch (err) {
        console.error('Error fetching actividades:', err);
        setError('Error al cargar el historial de actividad');
      } finally {
        setLoading(false);
      }
    }

    fetchActividades();
  }, [userData]);

  return { actividades, actividadesPorCurso, actividadesSinCurso, loading, error };
}
