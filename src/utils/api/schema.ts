import { type ClientSchema, a } from "@aws-amplify/data-schema";

// Enums defined first to be referenced in the models
const NivelDificultad = a.enum(["basico", "intermedio", "avanzado"]);
const EstadoCurso = a.enum(["activo", "inactivo"]);
const TipoSesion = a.enum(["estudio", "repaso", "examen"]);
const EstadoSesion = a.enum(["programada", "completada", "cancelada"]);
const TipoMaterial = a.enum(["video", "audio", "archivo"]);
const TipoCuestionario = a.enum(["autoevaluacion", "prueba_final"]);
const TipoPregunta = a.enum(["multiple", "verdadero_falso", "abierta"]);
const EstadoProgreso = a.enum(["pendiente", "en_proceso", "completado"]);
const EstadoInscripcion = a.enum([
  "en_progreso",
  "completado",
  "abandonado",
  "inscrito",
]);

export const MainSchema = a.schema({
  Usuario: a
    .model({
      usuarioId: a.id().required(), //id del usuario
      email: a.email().required(), //email del usuario
      nombre: a.string(),
      apellido: a.string(),
      ultimo_login: a.datetime(),
      isValid: a.boolean().default(false),
      createdAt: a.datetime(),

      // Relationships
      Cursos: a.hasMany("Curso", "usuarioId"),
      SesionesDeEstudio: a.hasMany("SesionEstudio", "usuarioId"),
      Respuestas: a.hasMany("Respuesta", "usuarioId"),
      ProgresoMateriales: a.hasMany("ProgresoMaterial", "usuarioId"),
      ProgresoCuestionarios: a.hasMany("ProgresoCuestionario", "usuarioId"),
      ProgresoLecciones: a.hasMany("ProgresoLeccion", "usuarioId"),
      Evaluaciones: a.hasMany("EvaluacionCurso", "usuarioId"),
      CursoCompartido: a.hasMany("CursoCompartido", "usuarioId"),
      BloqueEstudio: a.hasMany("BloqueEstudio", "usuarioId"),
    })
    .identifier(["usuarioId"])
    .secondaryIndexes((index) => [
      index("email").sortKeys(["createdAt"]).queryField("UsersByEmail"),
    ]),

  BloqueEstudio: a
    .model({
      bloqueEstudioId: a.id().required(),
      hora_inicio: a.time().required(),
      hora_fin: a.time().required(),
      duracion_minutos: a.integer(),
      usuarioId: a.id().required(),
      Usuario: a.belongsTo("Usuario", "usuarioId"),
    })
    .identifier(["bloqueEstudioId"]),

  Video: a.customType({
    videoId: a.string().required(),
    videoTitle: a.string().required(),
  }),

  Curso: a
    .model({
      cursoId: a.id().required(),
      titulo: a.string().required(),
      descripcion: a.string(),
      imagen_portada: a.url(),
      duracion_estimada: a.integer(),
      nivel_dificultad: NivelDificultad,
      estado: EstadoCurso,
      progreso_estimado: a.integer(),

      //metadata
      playlistId: a.string().required(),
      playlistTitle: a.string(),
      playlistDescription: a.string(),
      playlistThumbnail: a.url(),
      playlistChannelTitle: a.string(),
      playlistChannelId: a.string(),
      playlistPublishedAt: a.datetime(),
      playlistItemCount: a.integer(),
      //metadata

      // Relationships
      usuarioId: a.id().required(),
      Usuario: a.belongsTo("Usuario", "usuarioId"),
      SesionEstudio: a.hasMany("SesionEstudio", "cursoId"),
      MaterialEstudio: a.hasMany("MaterialEstudio", "cursoId"),
      Cuestionarios: a.hasMany("Cuestionario", "cursoId"),
      EvaluacionesCurso: a.hasMany("EvaluacionCurso", "cursoId"),
      Modulos: a.hasMany("Modulo", "cursoId"),
      CursoCompartido: a.hasMany("CursoCompartido", "cursoId"),
      Transcripcion: a.hasMany("Transcripcion", "cursoId"),
    })
    .identifier(["cursoId"]),

  Transcripcion: a
    .model({
      transcripcionId: a.id().required(),
      transcripcion: a.string(), //la string completa de la transcripcion
      transcripcionDuration: a.integer(),

      //video
      videoId: a.string(),
      videoTitle: a.string(),
      videoDescription: a.string(),
      videoThumbnail: a.url(),
      videoPublishedAt: a.datetime(),
      videoPosition: a.integer(),
      videoDuration: a.integer(),
      videoViewCount: a.integer(),

      // Relationships
      cursoId: a.id().required(),
      Curso: a.belongsTo("Curso", "cursoId"),
    })
    .identifier(["transcripcionId"]),

  CursoCompartido: a
    .model({
      estado: EstadoInscripcion,
      usuarioId: a.id().required(),
      Usuario: a.belongsTo("Usuario", "usuarioId"),
      cursoId: a.id().required(),
      Curso: a.belongsTo("Curso", "cursoId"),
    })
    .identifier(["usuarioId", "cursoId"]),

  Modulo: a
    .model({
      moduloId: a.id().required(),
      titulo: a.string().required(),
      descripcion: a.string(),
      duracion_estimada: a.integer(),
      orden: a.integer(),
      imagen_portada: a.url(),
      progreso_estimado: a.integer(),

      // Relationships
      cursoId: a.id().required(),
      Curso: a.belongsTo("Curso", "cursoId"),
      Lecciones: a.hasMany("Leccion", "moduloId"),
      Cuestionarios: a.hasMany("Cuestionario", "moduloId"),
    })
    .identifier(["moduloId"]),

  Leccion: a
    .model({
      leccionId: a.id().required(),
      titulo: a.string().required(),
      descripcion: a.string(),
      duracion_minutos: a.integer(),
      tipo: TipoMaterial,
      url_contenido: a.url().required(),
      completada: a.boolean().default(false),
      orden: a.integer(),
      moduloId: a.id().required(),
      Modulo: a.belongsTo("Modulo", "moduloId"),

      // Relationships
      MaterialesEstudio: a.hasMany("MaterialEstudio", "leccionId"),
      SesionesEstudio: a.hasMany("SesionEstudio", "leccionId"),
      ProgresoLecciones: a.hasMany("ProgresoLeccion", "leccionId"),
    })
    .identifier(["leccionId"]),

  SesionEstudio: a
    .model({
      sesionEstudioId: a.id().required(),
      fecha: a.date().required(),
      hora_inicio: a.time().required(),
      hora_fin: a.time().required(),
      duracion_minutos: a.integer(),
      tipo: TipoSesion,
      estado: EstadoSesion,
      google_event_id: a.string(),
      recordatorios: a.string(),

      // Relationships
      usuarioId: a.id().required(),
      Usuario: a.belongsTo("Usuario", "usuarioId"),
      cursoId: a.id(),
      Curso: a.belongsTo("Curso", "cursoId"),
      leccionId: a.id(),
      Leccion: a.belongsTo("Leccion", "leccionId"),
    })
    .identifier(["sesionEstudioId"]),

  MaterialEstudio: a
    .model({
      materialEstudioId: a.id().required(),
      titulo: a.string().required(),
      tipo: TipoMaterial,
      url_contenido: a.url().required(),
      orden: a.integer(),
      descripcion: a.string(),

      // Relationships
      cuestionarioId: a.id(),
      Cuestionario: a.hasOne("Cuestionario", "cuestionarioId"),
      cursoId: a.id().required(),
      Curso: a.belongsTo("Curso", "cursoId"),
      leccionId: a.id(),
      Leccion: a.belongsTo("Leccion", "leccionId"),
      ProgresoMateriales: a.hasMany("ProgresoMaterial", "materialEstudioId"),
    })
    .identifier(["materialEstudioId"]),

  Cuestionario: a
    .model({
      cuestionarioId: a.id().required(),
      titulo: a.string().required(),
      descripcion: a.string(),
      tipo: TipoCuestionario,
      puntos_maximos: a.integer().default(100),
      duracion_minutos: a.integer(),
      intentos_permitidos: a.integer().default(1),
      preguntas_aleatorias: a.boolean().default(false), // If true, randomize question order
      porcentaje_aprobacion: a.integer().default(70), // Minimum percentage to pass the quiz

      // Relationships
      Preguntas: a.hasMany("Pregunta", "cuestionarioId"),
      cursoId: a.id().required(),
      Curso: a.belongsTo("Curso", "cursoId"),
      moduloId: a.id(),
      Modulo: a.belongsTo("Modulo", "moduloId"),
      materialEstudioId: a.id(),
      MaterialesEstudio: a.belongsTo("MaterialEstudio", "cuestionarioId"),
      ProgresoCuestionario: a.hasMany("ProgresoCuestionario", "cuestionarioId"),
    })
    .identifier(["cuestionarioId"]),

  Pregunta: a
    .model({
      preguntaId: a.id().required(),
      texto_pregunta: a.string().required(),
      tipo: TipoPregunta,
      peso_puntos: a.integer().default(1),
      orden: a.integer(),
      explicacion: a.string(),

      // Relationships
      cuestionarioId: a.id().required(),
      Cuestionario: a.belongsTo("Cuestionario", "cuestionarioId"),
      Opciones: a.hasMany("OpcionPregunta", "preguntaId"),
      Respuestas: a.hasMany("Respuesta", "preguntaId"),
    })
    .identifier(["preguntaId"]),

  OpcionPregunta: a
    .model({
      opcionId: a.id().required(),
      texto: a.string().required(),
      orden: a.integer(),
      imagen: a.url(),
      audio: a.url(),
      video: a.url(),
      archivo: a.url(),
      es_correcta: a.boolean().required(),

      // Relationships
      preguntaId: a.id().required(),
      Pregunta: a.belongsTo("Pregunta", "preguntaId"),
      Respuestas: a.hasMany("Respuesta", "opcionId"),
    })
    .identifier(["opcionId"]),

  Respuesta: a
    .model({
      respuestaId: a.id().required(),
      respuesta_texto: a.string(), // For open-ended questions
      es_correcta: a.boolean(),
      fecha_respuesta: a.datetime(),

      // Relationships
      usuarioId: a.id().required(),
      Usuario: a.belongsTo("Usuario", "usuarioId"),
      preguntaId: a.id().required(),
      Pregunta: a.belongsTo("Pregunta", "preguntaId"),
      opcionId: a.id(), // For multiple choice / true-false questions
      Opcion: a.belongsTo("OpcionPregunta", "opcionId"),
      progresoCuestionarioId: a.string(), // Links to the quiz attempt
      ProgresoCuestionario: a.belongsTo(
        "ProgresoCuestionario",
        "progresoCuestionarioId"
      ),
    })
    .identifier(["respuestaId"])
    .secondaryIndexes((index) => [
      index("usuarioId")
        .sortKeys(["preguntaId"])
        .queryField("RespuestasByUsuarioAndPregunta"),
    ]),

  ProgresoMaterial: a
    .model({
      usuarioId: a.id().required(),
      materialEstudioId: a.id().required(),
      estado: EstadoProgreso,
      fecha_completado: a.datetime(),

      // Relationships
      Usuario: a.belongsTo("Usuario", "usuarioId"),
      Material: a.belongsTo("MaterialEstudio", "materialEstudioId"),
    })
    .identifier(["usuarioId", "materialEstudioId"]),

  ProgresoLeccion: a
    .model({
      usuarioId: a.id().required(),
      leccionId: a.id().required(),
      completada: a.boolean().default(false),
      fecha_completado: a.datetime(),
      Usuario: a.belongsTo("Usuario", "usuarioId"),
      Leccion: a.belongsTo("Leccion", "leccionId"),
    })
    .identifier(["usuarioId", "leccionId"]),

  ProgresoCuestionario: a
    .model({
      progresoCuestionarioId: a.string().required(),
      estado: EstadoProgreso,
      puntaje_obtenido: a.integer().default(0),
      aprobado: a.boolean(), // Whether the user passed the quiz
      fecha_completado: a.datetime(),
      intento_numero: a.integer().required(), // Which attempt is this (1st, 2nd, 3rd, etc.)
      ultima_pregunta_respondida: a.integer(), // Index of last answered question (0-based)
      recomendaciones: a.string(), // AI-generated recommendations based on quiz results

      // Relationships
      usuarioId: a.id().required(),
      Usuario: a.belongsTo("Usuario", "usuarioId"),
      cuestionarioId: a.id().required(),
      Cuestionario: a.belongsTo("Cuestionario", "cuestionarioId"),
      Respuestas: a.hasMany("Respuesta", "progresoCuestionarioId"), // All answers for this quiz attempt
    })
    .identifier(["progresoCuestionarioId"])
    .secondaryIndexes((index) => [
      index("usuarioId")
        .sortKeys(["cuestionarioId", "intento_numero"])
        .queryField("ProgresoCuestionarioByUsuarioAndCuestionario"),
    ]),

  EvaluacionCurso: a
    .model({
      calificacion: a.integer(),
      comentario: a.string(),
      fecha_evaluacion: a.datetime(),

      // Relationships
      cursoId: a.id().required(),
      Curso: a.belongsTo("Curso", "cursoId"),
      usuarioId: a.id().required(),
      Usuario: a.belongsTo("Usuario", "usuarioId"),
    })
    .identifier(["usuarioId", "cursoId"]),
});

export type MainTypes = Exclude<ClientSchema<typeof MainSchema>, "Video">;
