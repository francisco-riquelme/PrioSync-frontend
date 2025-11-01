import { useState, useCallback } from "react";
import { generateClient } from "aws-amplify/api";
import { ResolversTypes } from "@/utils/api/resolverSchema";
import { getGlobalCache } from "@/utils/commons/queries/cache";

let _client: ReturnType<typeof generateClient<ResolversTypes>> | null = null;
function getClient() {
  if (!_client) {
    _client = generateClient<ResolversTypes>();
  }
  return _client;
}

export interface CrearQuestionarioFinalResponse {
  message?: string;
}

export interface UseCrearQuestionarioFinalParams {
  onSuccess?: () => void;
}

export const useCrearQuestionarioFinal = (params?: UseCrearQuestionarioFinalParams) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = useCallback(
    async (cursoId: string): Promise<CrearQuestionarioFinalResponse> => {
      setLoading(true);
      setError(null);
      try {
        const client = getClient();
        const { data, errors } =
          await client.mutations.crearQuestionarioFinalResolver({
            cursoId: cursoId,
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
          const message = "No se pudo crear el cuestionario final";
          setError(message);
          throw new Error(message);
        }

        // Call success callback if provided
        if (params?.onSuccess) {
          console.log(
            "Final quiz created successfully, calling onSuccess callback"
          );
          params.onSuccess();
        } else {
          console.log(
            "Final quiz created successfully, but no onSuccess callback provided"
          );
        }

        // Invalidate cache for Curso model since it now has a new final quiz
        const cache = getGlobalCache();
        cache.invalidatePattern("Curso:");
        console.log("Cache invalidated for Curso model");

        return data as CrearQuestionarioFinalResponse;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  return { loading, error, crear } as const;
};
