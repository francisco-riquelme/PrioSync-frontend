import { useState, useCallback } from "react";
import amplifyOutputs from '../../../../amplify_outputs.json';

export interface PuedeGenerarResponse {
  canGenerate?: boolean;
  reason?: string;
  missing?: string[];
  message?: string;
}

export const usePuedeGenerarQuestionario = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async (moduloId: string): Promise<PuedeGenerarResponse> => {
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

      const query = `query PuedeGenerarQuestionario($moduloId: ID!) { puedeGenerarQuestionario(moduloId: $moduloId) { canGenerate reason } }`;

      const resp = await fetch(appsyncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': appsyncKey,
        },
        body: JSON.stringify({ query, variables: { moduloId } }),
      });

      const json = await resp.json();
      if (json.errors) {
        const message = json.errors[0]?.message || 'GraphQL error';
        setError(message);
        throw new Error(message);
      }

      const data = json.data?.puedeGenerarQuestionario || {};
      return data;
    } catch {
      // error already captured in res handling or not needed here
      setError('Error al comprobar la generación del cuestionario');
      throw new Error('Error al comprobar la generación del cuestionario');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, check } as const;
};
