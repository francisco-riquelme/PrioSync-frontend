import { useState, useCallback } from "react";
import amplifyOutputs from '../../../../amplify_outputs.json';

function getAppSyncConfig() {
  const envUrl = process?.env?.NEXT_PUBLIC_APPSYNC_URL as string | undefined;
  const envKey = process?.env?.NEXT_PUBLIC_APPSYNC_API_KEY as string | undefined;

  if (envUrl && envKey) return { url: envUrl, key: envKey };

  const fileUrl = amplifyOutputs?.data?.url as string | undefined;
  const fileKey = amplifyOutputs?.data?.api_key as string | undefined;

  return { url: fileUrl, key: fileKey };
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
      const { url: appsyncUrl, key: appsyncKey } = getAppSyncConfig();

      if (!appsyncUrl || !appsyncKey) {
        const missing = [] as string[];
        if (!appsyncUrl) missing.push('NEXT_PUBLIC_APPSYNC_URL or amplify_outputs.json');
        if (!appsyncKey) missing.push('NEXT_PUBLIC_APPSYNC_API_KEY or amplify_outputs.json');
        const message = `AppSync no configurado: ${missing.join(', ')}`;
        setError(message);
        throw new Error(message);
      }

      const mutation = `mutation CrearQuestionario($moduloId: ID!) { crearQuestionario(moduloId: $moduloId) { cuestionarioId titulo tipo } }`;

      const resp = await fetch(appsyncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': appsyncKey,
        },
        body: JSON.stringify({ query: mutation, variables: { moduloId } }),
      });

      let json: unknown = null;
      try {
        json = await resp.json();
      } catch {
        const txt = await resp.text().catch(() => '<non-text response>');
        const message = `HTTP ${resp.status} - no JSON response: ${txt}`;
        setError(message);
        throw new Error(message);
      }

      const parsed = json as { errors?: Array<{ message?: string }>; data?: Record<string, unknown> };

      if (!resp.ok) {
        const message = parsed?.errors?.[0]?.message || `HTTP ${resp.status}: ${resp.statusText}`;
        setError(message);
        throw new Error(message);
      }

      if (parsed.errors) {
        const message = parsed.errors[0]?.message || 'GraphQL error';
        setError(message);
        throw new Error(message);
      }

      return (parsed.data?.crearQuestionario as unknown) || {};
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, crear } as const;
};
