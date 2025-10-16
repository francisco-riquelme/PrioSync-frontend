import { useState, useCallback } from "react";
import { generateClient } from "aws-amplify/api";
import { ResolversTypes } from "@/utils/api/resolverSchema";
const client = generateClient<ResolversTypes>();

export interface CrearQuestionarioResponse {
  cuestionarioId?: string;
  titulo?: string;
  tipo?: string;
  missing?: string[];
  message?: string;
}

export const useCrearQuestionario = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = useCallback(
    async (moduloId: string): Promise<CrearQuestionarioResponse> => {
      setLoading(true);
      setError(null);
      try {
        const { data: cuestionarioResp, errors } =
          await client.mutations.crearQuestionarioResolver({
            moduloId: moduloId,
          });

        if (errors) {
          throw errors;
        }

        const realResp = cuestionarioResp!;
        let parsed;
        try {
          JSON.parse(realResp.message);
        } catch (error) {
          throw "no pude parsear lo " + JSON.stringify(error);
        }

        return parsed || {};
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, crear } as const;
};
