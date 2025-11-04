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

export interface CrearQuestionarioResponse {
  message?: string;
}

export interface UseCrearQuestionarioParams {
  onSuccess?: () => void;
}

export const useCrearQuestionario = (params?: UseCrearQuestionarioParams) => {
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

        // Call success callback if provided
        if (params?.onSuccess) {
          console.log(
            "✅ Quiz created successfully, calling onSuccess callback"
          );
          params.onSuccess();
        } else {
          console.log(
            "✅ Quiz created successfully, but no onSuccess callback provided"
          );
        }

        // Invalidate cache for Curso model since it now has a new quiz
        const cache = getGlobalCache();
        cache.invalidatePattern("Curso:");
        console.log("🗑️ Cache invalidated for Curso model");

        return data as CrearQuestionarioResponse;
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
