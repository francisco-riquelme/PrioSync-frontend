import { type ClientSchema, a } from "@aws-amplify/backend";

export const ResolverSchema = a
  .schema({
    makeExampleResolver: a
      .mutation()
      .arguments({
        question: a.string().required(),
        context: a.string(),
      })
      .returns(
        a.customType({
          message: a.string().required(),
        })
      ),

    crearQuestionarioResolver: a
      .mutation()
      .arguments({
        moduloId: a.string().required(),
      })
      .returns(a.customType({ message: a.string().required() })),

    crearMaterialResolver: a
      .mutation()
      .arguments({
        moduloId: a.string().required(),
        modoGeneracion: a.string(),
      })
      .returns(
        a.customType({
          materialId: a.string().required(),
          message: a.string(),
        })
      ),

    crearQuestionarioFinalResolver: a
      .mutation()
      .arguments({
        cursoId: a.string().required(),
      })
      .returns(a.customType({ message: a.string().required() })),

    generarRetroalimentacionQuizResolver: a
      .mutation()
      .arguments({
        progresoCuestionarioId: a.string().required(),
        cuestionarioId: a.string().required(),
        usuarioId: a.string().required(),
      })
      .returns(
        a.customType({
          recomendaciones: a.string().required(),
          message: a.string(),
        })
      ),

    generarCitasResolver: a
      .mutation()
      .arguments({
        cursoId: a.string().required(),
        usuarioId: a.string().required(),
      })
      .returns(a.customType({ message: a.string().required() })),

    createCourseFromPlaylistResolver: a
      .mutation()
      .arguments({
        playlistId: a.string().required(),
        usuarioId: a.string().required(),
      })
      .returns(
        a.customType({
          message: a.string().required(),
          executionArn: a.string(),
          cursoId: a.string(),
          playlistId: a.string(),
          usuarioId: a.string(),
          status: a.string(),
        })
      ),
  })
  .authorization((allow) => [
    allow.guest(),
    allow.authenticated(),
    allow.publicApiKey(),
  ]);

export type ResolversTypes = ClientSchema<typeof ResolverSchema>;
