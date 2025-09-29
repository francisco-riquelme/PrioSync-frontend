import {
  AmplifyOutputsType,
  initializeQueries,
  QueryFactory,
} from "@/utils/commons/queries";
import amplifyOutputs from "../../../amplify_outputs.json";
import { MainSchema, type MainTypes } from "@/utils/api/schema";

export const initializeDB = async () => {
  await initializeQueries<typeof MainSchema, MainTypes>({
    amplifyOutputs: amplifyOutputs as unknown as AmplifyOutputsType,
    schema: MainSchema,
  });

  const Usuario = await QueryFactory<MainTypes, "Usuario">({ name: "Usuario" });

  const Curso = await QueryFactory<MainTypes, "Curso">({ name: "Curso" });

  const InscripcionCurso = await QueryFactory<MainTypes, "InscripcionCurso">({
    name: "InscripcionCurso",
  });

  const SesionEstudio = await QueryFactory<MainTypes, "SesionEstudio">({
    name: "SesionEstudio",
  });

  const MaterialEstudio = await QueryFactory<MainTypes, "MaterialEstudio">({
    name: "MaterialEstudio",
  });

  const Cuestionario = await QueryFactory<MainTypes, "Cuestionario">({
    name: "Cuestionario",
  });

  const Pregunta = await QueryFactory<MainTypes, "Pregunta">({
    name: "Pregunta",
  });

  const Respuesta = await QueryFactory<MainTypes, "Respuesta">({
    name: "Respuesta",
  });

  const ProgresoMaterial = await QueryFactory<MainTypes, "ProgresoMaterial">({
    name: "ProgresoMaterial",
  });

  const ProgresoCuestionario = await QueryFactory<
    MainTypes,
    "ProgresoCuestionario"
  >({ name: "ProgresoCuestionario" });

  const EvaluacionCurso = await QueryFactory<MainTypes, "EvaluacionCurso">({
    name: "EvaluacionCurso",
  });

  return {
    models: {
      Usuario,
      Curso,
      InscripcionCurso,
      SesionEstudio,
      MaterialEstudio,
      Cuestionario,
      Pregunta,
      Respuesta,
      ProgresoMaterial,
      ProgresoCuestionario,
      EvaluacionCurso,
    },
  };
};

(() => {
  initializeDB();
})();
