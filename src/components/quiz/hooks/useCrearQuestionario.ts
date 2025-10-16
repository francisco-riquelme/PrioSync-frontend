import { useState, useCallback } from "react";
import amplifyOutputs from '../../../../amplify_outputs.json';

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
      const appsyncUrl = amplifyOutputs?.data?.url as string | undefined;
      const appsyncKey = amplifyOutputs?.data?.api_key as string | undefined;

      if (!appsyncUrl || !appsyncKey) {
        const missing = [] as string[];
        if (!appsyncUrl) missing.push('APPSYNC_URL');
        if (!appsyncKey) missing.push('APPSYNC_API_KEY');
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

      const json = await resp.json();
      if (json.errors) {
        const message = json.errors[0]?.message || 'GraphQL error';
        setError(message);
        throw new Error(message);
      }

      return json.data?.crearQuestionario || {};
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, crear } as const;
};
