import { useState, useCallback } from "react";
import { generateClient } from "aws-amplify/api";
import { ResolversTypes } from "@/utils/api/resolverSchema";

let _client: ReturnType<typeof generateClient<ResolversTypes>> | null = null;
function getClient() {
  if (!_client) {
    _client = generateClient<ResolversTypes>();
  }
  return _client;
}

export interface CrearQuestionarioResponse {
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
        const client = getClient();
        const { data, errors } =
          await client.mutations.crearQuestionarioResolver({
            moduloId: moduloId,
          });

        if (errors && errors.length > 0) {
          const errorMessage = errors
            .map((e: unknown) => {
              if (e && typeof e === "object" && "message" in e) {
                return String((e as { message: unknown }).message);
              }
              return String(e);
            })
            .join("; ");
          setError(errorMessage);
          throw new Error(errorMessage);
        }

        if (!data) {
          const message = "No se pudo crear el cuestionario";
          setError(message);
          throw new Error(message);
        }

        return data as CrearQuestionarioResponse;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, crear } as const;
};
