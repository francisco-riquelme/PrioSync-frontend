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
  cuestionarioId?: string;
  titulo?: string;
  tipo?: string;
  missing?: string[];
  message?: string;
}

export const useCrearQuestionario = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = useCallback(async (moduloId: string): Promise<CrearQuestionarioResponse> => {
    setLoading(true);
    setError(null);
    try {
      const client = getClient();
      const { data: cuestionarioResp, errors } = await client.mutations.crearQuestionarioResolver({
        moduloId: moduloId,
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map((e) => e?.message || String(e)).join("; "));
      }

      const realResp = cuestionarioResp!;

  // Debug: log raw response to help backend debugging when parse fails
  // (This is intentionally verbose to capture the exact payload returned by the resolver.)
  console.debug("useCrearQuestionario - raw resolver response:", realResp);

      if (!realResp) {
        const message = "Empty response from crearQuestionarioResolver";
        setError(message);
        throw new Error(message);
      }

      let parsed: CrearQuestionarioResponse = {};

      // Accept string messages from resolver as a valid success response
      // (some backends return a human-readable message instead of JSON).
      if (typeof realResp === "string") {
        parsed = { message: realResp };
      } else if (realResp && typeof realResp.message === "string") {
        // Try parse JSON; if it fails, fall back to returning the raw message
        try {
          parsed = JSON.parse(realResp.message) as CrearQuestionarioResponse;
        } catch (parseErr) {
          const rawMessage = realResp.message;
          if (process.env.NODE_ENV !== "production") {
            console.warn("useCrearQuestionario - parse warning: returning raw message instead of JSON", { parseErr, rawMessage, realResp });
          }
          parsed = { message: rawMessage };
        }
      } else if (realResp && typeof realResp === "object") {
        // Resolver already returned an object-shaped payload
        parsed = realResp as CrearQuestionarioResponse;
      } else {
        parsed = {};
      }

      return parsed || {};
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, crear } as const;
};
