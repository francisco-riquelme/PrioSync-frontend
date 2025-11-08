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
  executionArn?: string | null;
  cursoId?: string | null;
  cuestionarioId?: string | null;
  status?: string | null;
}

export interface UseCrearQuestionarioFinalParams {
  onSuccess?: () => void;
}

export const useCrearQuestionarioFinal = (
  params?: UseCrearQuestionarioFinalParams
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = useCallback(
    async (
      cursoId: string
    ): Promise<CrearQuestionarioFinalResponse> => {
      console.log(
        `🚀 [useCrearQuestionarioFinal] Starting final quiz creation for cursoId: ${cursoId}`
      );
      setLoading(true);
      setError(null);
      try {
        const client = getClient();
        console.log(
          "📤 [useCrearQuestionarioFinal] Calling crearQuestionarioFinalResolver mutation"
        );
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

        const response = data as CrearQuestionarioFinalResponse;

        console.log("📝 [useCrearQuestionarioFinal] Mutation response:", {
          cursoId: response.cursoId,
          cuestionarioId: response.cuestionarioId,
          executionArn: response.executionArn,
          status: response.status,
        });

        // Call success callback if provided
        if (params?.onSuccess) {
          console.log(
            "✅ Final quiz created successfully, calling onSuccess callback"
          );
          params.onSuccess();
        }

        // Invalidate cache for Curso model since it now has a new final quiz
        const cache = getGlobalCache();
        cache.invalidatePattern("Curso:");
        console.log("Cache invalidated for Curso model");

        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ [useCrearQuestionarioFinal] Error in crear:", err);
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
