import { type ClientSchema, a } from "@aws-amplify/data-schema";

// Enums defined first to be referenced in the models
const NivelDificultad = a.enum(["basico", "intermedio", "avanzado"]);
const EstadoCurso = a.enum(["activo", "inactivo"]);
const EstadoInscripcion = a.enum([
  "en_progreso",
  "completado",
  "abandonado",
  "inscrito",
]);
const TipoSesion = a.enum(["estudio", "repaso", "examen"]);
const EstadoSesion = a.enum(["programada", "completada", "cancelada"]);
const TipoMaterial = a.enum(["video", "audio", "archivo"]);
const TipoCuestionario = a.enum(["autoevaluacion", "prueba_final"]);
const TipoPregunta = a.enum(["multiple", "verdadero_falso", "abierta"]);
const EstadoProgreso = a.enum(["pendiente", "en_proceso", "completado"]);

export const MainSchema = a.schema({
  Usuario: a
    .model({
      usuarioId: a.id().required(), //id del usuario
      email: a.email().required(), //email del usuario
      nombre: a.string().required(),
      apellido: a.string(),
      ultimo_login: a.datetime(),
      isValid: a.boolean().default(false),
      createdAt: a.datetime(),

      // Relationships
      InscripcionesCurso: a.hasMany("InscripcionCurso", "usuarioId"),
      SesionesDeEstudio: a.hasMany("SesionEstudio", "usuarioId"),
      Respuestas: a.hasMany("Respuesta", "usuarioId"),
      ProgresoMateriales: a.hasMany("ProgresoMaterial", "usuarioId"),
      ProgresoCuestionarios: a.hasMany("ProgresoCuestionario", "usuarioId"),
      Evaluaciones: a.hasMany("EvaluacionCurso", "usuarioId"),
    })
    .identifier(["usuarioId"])
    .secondaryIndexes((index) => [
      index("email").sortKeys(["createdAt"]).queryField("UsersByEmail"),
    ]),

  Curso: a
    .model({
      cursoId: a.id().required(),
      titulo: a.string().required(),
      descripcion: a.string(),
      imagen_portada: a.url(),
      duracion_estimada: a.integer(),
      nivel_dificultad: NivelDificultad,
      estado: EstadoCurso,

      // Relationships
      InscripcionesCurso: a.hasMany("InscripcionCurso", "cursoId"),
      SesionEstudio: a.hasMany("SesionEstudio", "cursoId"),
      MaterialEstudio: a.hasMany("MaterialEstudio", "cursoId"),
      Cuestionarios: a.hasMany("Cuestionario", "cursoId"),
      EvaluacionesCurso: a.hasMany("EvaluacionCurso", "cursoId"),
      Lecciones: a.hasMany("Leccion", "cursoId"),
    })
    .identifier(["cursoId"]),

  Leccion: a
    .model({
      leccionId: a.id().required(),
      titulo: a.string().required(),
      descripcion: a.string(),
      duracion_minutos: a.integer(),
      tipo: TipoMaterial,
      url_contenido: a.url().required(),
      orden: a.integer(),
      cursoId: a.id().required(),
      Curso: a.belongsTo("Curso", "cursoId"),

      // Relationship with MaterialEstudio
      MaterialesEstudio: a.hasMany("MaterialEstudio", "leccionId"),
    })
    .identifier(["leccionId"]),

  InscripcionCurso: a
    .model({
      fecha_inscripcion: a.datetime(),
      estado: EstadoInscripcion,

      // Relationships
      usuarioId: a.id().required(),
      Usuario: a.belongsTo("Usuario", "usuarioId"),
      cursoId: a.id().required(),
      Curso: a.belongsTo("Curso", "cursoId"),
    })
    .identifier(["usuarioId", "cursoId"]),

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

      // Relationship with Leccion
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

export type MainTypes = ClientSchema<typeof MainSchema>;

// Export commonly used types for easier importing
export type Usuario = MainTypes["Usuario"]["type"];
export type Curso = MainTypes["Curso"]["type"];
export type Leccion = MainTypes["Leccion"]["type"];
export type InscripcionCurso = MainTypes["InscripcionCurso"]["type"];
export type SesionEstudio = MainTypes["SesionEstudio"]["type"];
export type MaterialEstudio = MainTypes["MaterialEstudio"]["type"];
export type Cuestionario = MainTypes["Cuestionario"]["type"];
export type Pregunta = MainTypes["Pregunta"]["type"];
export type OpcionPregunta = MainTypes["OpcionPregunta"]["type"];
export type Respuesta = MainTypes["Respuesta"]["type"];
export type ProgresoMaterial = MainTypes["ProgresoMaterial"]["type"];
export type ProgresoCuestionario = MainTypes["ProgresoCuestionario"]["type"];
export type EvaluacionCurso = MainTypes["EvaluacionCurso"]["type"];

// Export enum types
export type EstadoInscripcionType =
  | "en_progreso"
  | "completado"
  | "abandonado"
  | "inscrito";
export type TipoSesionType = "estudio" | "repaso" | "examen";
export type EstadoSesionType = "programada" | "completada" | "cancelada";
export type TipoMaterialType = "video" | "audio" | "archivo";
export type TipoCuestionarioType = "autoevaluacion" | "prueba_final";
export type TipoPreguntaType = "multiple" | "verdadero_falso" | "abierta";
export type EstadoProgresoType = "pendiente" | "en_proceso" | "completado";
export type NivelDificultadType = "basico" | "intermedio" | "avanzado";
export type EstadoCursoType = "activo" | "inactivo";
