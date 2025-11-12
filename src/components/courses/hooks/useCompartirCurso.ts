import { useState, useCallback } from "react";
import type { MainTypes } from "@/utils/api/schema";

interface CompartirCursoInput {
  usuarioId: string;
  cursoId: string;
  estado?: "inscrito" | "en_progreso" | "completado" | "abandonado";
}

interface SharedCourseData {
  shareUrl: string;
  shareCode: string;
  expiresAt?: Date;
}

export function useCompartirCurso() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crearCursoCompartido = async (
    input: CompartirCursoInput
  ): Promise<SharedCourseData | null> => {
    setLoading(true);
    setError(null);

    console.log("🔍 DEBUG - crearCursoCompartido input:", input);

    try {
      // Validar que el cursoId sea válido
      if (!input.cursoId || input.cursoId.trim().length < 2) {
        throw new Error(`CourseId inválido: "${input.cursoId}"`);
      }

      if (!input.usuarioId || input.usuarioId.trim().length < 2) {
        throw new Error(`UsuarioId inválido: "${input.usuarioId}"`);
      }

      // Importar dinámicamente las utilities de Amplify
      const { getQueryFactories } = await import("@/utils/commons/queries");

      // Obtener la factory para CursoCompartido
      const { CursoCompartido } = await getQueryFactories<
        Pick<MainTypes, "CursoCompartido">,
        "CursoCompartido"
      >({
        entities: ["CursoCompartido"],
      });

      // Sanity check: Verificar si ya existe un registro de CursoCompartido
      try {
        const existingRecord = await CursoCompartido.get({
          input: {
            usuarioId: input.usuarioId,
            cursoId: input.cursoId,
          },
        });

        if (existingRecord) {
          console.log(
            "✅ CursoCompartido ya existe, retornando datos existentes"
          );
          // Si ya existe, retornar los datos de compartir sin crear duplicado
          const shareCode = input.cursoId.trim();
          const baseUrl =
            typeof window !== "undefined" ? window.location.origin : "";
          const shareUrl = `${baseUrl}/courses/shared/${shareCode}`;

          return {
            shareUrl,
            shareCode,
            expiresAt: undefined,
          };
        }
      } catch (getError) {
        // Si no existe, continuar con la creación
        // El error puede ser porque no existe el registro, lo cual es esperado
        console.log(
          "ℹ️ No existe registro previo, procediendo a crear uno nuevo"
        );
      }

      // Crear el registro de CursoCompartido
      const estado = input.estado || "inscrito";
      const cursoCompartidoResult = await CursoCompartido.create({
        input: {
          usuarioId: input.usuarioId,
          cursoId: input.cursoId,
          estado: estado as
            | "inscrito"
            | "en_progreso"
            | "completado"
            | "abandonado",
        },
      });

      console.log(
        "✅ CursoCompartido creado exitosamente:",
        cursoCompartidoResult
      );

      // Usar cursoId directamente como código compartido
      const shareCode = input.cursoId.trim();
      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      const shareUrl = `${baseUrl}/courses/shared/${shareCode}`;

      console.log("🔍 DEBUG - shareCode:", shareCode);
      console.log("🔍 DEBUG - baseUrl:", baseUrl);
      console.log("🔍 DEBUG - shareUrl:", shareUrl);

      // Validar que la URL final sea correcta
      if (!shareUrl.includes("/courses/shared/") || shareCode.length < 2) {
        throw new Error(
          `URL de compartir malformada: ${shareUrl} (shareCode: ${shareCode})`
        );
      }

      return {
        shareUrl,
        shareCode,
        expiresAt: undefined, // Sin expiración por ahora
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al compartir el curso";
      setError(errorMessage);
      console.error("Error compartiendo curso:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsAppUrl = useCallback(
    (courseTitle: string, shareUrl: string) => {
      // Validar que la shareUrl sea válida
      if (!shareUrl || !shareUrl.includes("/courses/shared/")) {
        console.error("🚨 DEBUG - URL de compartir inválida:", shareUrl);
        return "";
      }

      const message = `🎓 ¡Te han compartido un curso!

📚 ${courseTitle}

🚀 Únete gratis y comienza tu aprendizaje:
${shareUrl}

#PrioSync #Aprendizaje #CursoGratis`;

      console.log("🔍 DEBUG - Original message:", message);
      console.log("🔍 DEBUG - Original shareUrl:", shareUrl);

      // Usar encodeURIComponent para una codificación más estándar
      const encodedMessage = encodeURIComponent(message);

      const finalUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
      console.log("🔍 DEBUG - Final WhatsApp URL:", finalUrl);

      return finalUrl;
    },
    []
  );

  const obtenerCursoCompartido = useCallback(async (shareCode: string) => {
    setLoading(true);
    setError(null);

    try {
      // shareCode ahora es directamente el cursoId
      const cursoId = shareCode;

      console.log("🔍 Obteniendo curso compartido:", cursoId);

      // Importar dinámicamente las utilities de Amplify
      const { getQueryFactories } = await import("@/utils/commons/queries");

      // Obtener la factory para Curso
      const { Curso } = await getQueryFactories<
        Pick<MainTypes, "Curso">,
        "Curso"
      >({
        entities: ["Curso"],
      });

      // Buscar el curso por ID
      const cursoResult = await Curso.get({
        input: { cursoId },
        selectionSet: [
          "cursoId",
          "titulo",
          "descripcion",
          "imagen_portada",
          "nivel_dificultad",
          "duracion_estimada",
          "createdAt",
          "updatedAt",
          "usuarioId",
          "Usuario.nombre",
          "Usuario.email",
        ],
      });

      if (!cursoResult) {
        throw new Error("Curso no encontrado");
      }

      console.log("✅ Curso encontrado:", cursoResult);

      return {
        curso: {
          cursoId: cursoResult.cursoId,
          titulo: cursoResult.titulo,
          descripcion: cursoResult.descripcion || null,
          imagen_portada: cursoResult.imagen_portada || null,
          nivel_dificultad: cursoResult.nivel_dificultad || null,
          duracion_estimada: cursoResult.duracion_estimada || null,
          createdAt: cursoResult.createdAt,
          updatedAt: cursoResult.updatedAt,
        },
        compartidoPor: {
          usuarioId: cursoResult.usuarioId,
          nombre:
            (cursoResult.Usuario as { nombre?: string })?.nombre ||
            "Usuario desconocido",
          email: (cursoResult.Usuario as { email?: string })?.email || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        shareCode,
        shareUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/courses/shared/${shareCode}`,
        estado: "inscrito" as const,
        fechaCompartido: new Date().toISOString(),
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error al obtener curso compartido";
      setError(errorMessage);
      console.error("Error obteniendo curso compartido:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const inscribirseACursoCompartido = useCallback(
    async (data: {
      usuarioId: string;
      cursoId: string;
      codigoCompartido?: string;
    }) => {
      setLoading(true);
      setError(null);

      try {
        console.log("🔄 Inscribiéndose al curso:", data);

        // Importar dinámicamente las utilities de Amplify
        const { getQueryFactories } = await import("@/utils/commons/queries");

        // Obtener la factory para CursoCompartido
        const { CursoCompartido } = await getQueryFactories<
          Pick<MainTypes, "CursoCompartido">,
          "CursoCompartido"
        >({
          entities: ["CursoCompartido"],
        });

        // Sanity check: Verificar si ya existe un registro de CursoCompartido
        try {
          const existingRecord = await CursoCompartido.get({
            input: {
              usuarioId: data.usuarioId,
              cursoId: data.cursoId,
            },
          });

          if (existingRecord) {
            console.log("✅ Usuario ya está inscrito en este curso");
            // Si ya existe, retornar éxito sin crear duplicado
            return true;
          }
        } catch (getError) {
          // Si no existe, continuar con la creación
          // El error puede ser porque no existe el registro, lo cual es esperado
          console.log(
            "ℹ️ No existe inscripción previa, procediendo a crear una nueva"
          );
        }

        // Crear el registro de curso compartido (inscripción)
        const inscripcionResult = await CursoCompartido.create({
          input: {
            usuarioId: data.usuarioId,
            cursoId: data.cursoId,
            estado: "inscrito" as const,
          },
        });

        console.log("✅ Inscripción exitosa:", inscripcionResult);

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al inscribirse al curso";
        setError(errorMessage);
        console.error("❌ Error inscribiéndose al curso:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const listarCursosCompartidos = async (usuarioId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Por ahora devolvemos una lista vacía
      // En producción, aquí iría la consulta real a Amplify

      console.log("Listando cursos compartidos para:", usuarioId);
      return [];
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error al listar cursos compartidos";
      setError(errorMessage);
      console.error("Error listando cursos compartidos:", err);
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
    clearError: () => setError(null),
  };
}
