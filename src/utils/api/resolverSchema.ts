import { type ClientSchema, a } from "@aws-amplify/data-schema";

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

    loadYoutubeDataResolver: a
      .mutation()
      .arguments({
        playlistId: a.string().required(),
      })
      .returns(
        a.customType({
          message: a.string().required(),
        })
      ),

    crearModulosResolver: a
      .mutation()
      .arguments({
        cursoId: a.string().required(),
      })
      .returns(a.customType({ message: a.string().required() })),

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
    generarCitasResolver: a
      .mutation()
      .arguments({
        cursoId: a.string().required(),
      })
      .returns(a.customType({ message: a.string().required() })),
  })
  .authorization((allow) => [
    allow.publicApiKey(), // Temporarily allow public access for deployment
    allow.guest(),
    allow.authenticated(),
  ]);

export type ResolversTypes = ClientSchema<typeof ResolverSchema>;
