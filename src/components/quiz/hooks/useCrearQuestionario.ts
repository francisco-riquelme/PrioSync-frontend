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

      const payload = { query: mutation, variables: { moduloId } };
      console.debug('AppSync request - CrearQuestionario payload:', payload);
      const resp = await fetch(appsyncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': appsyncKey,
        },
        body: JSON.stringify(payload),
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

      // Si la respuesta HTTP no es OK, revisar parsed.errors para fallback antes de lanzar
      if (!resp.ok) {
        const message = parsed?.errors?.[0]?.message || `HTTP ${resp.status}: ${resp.statusText}`;

        if (parsed?.errors && message.includes('FieldUndefined') && message.includes('crearQuestionario')) {
          // El resolver alternativo definido en amplify_outputs.json espera moduloId: String!
          // y su return type contiene solo { message: String }.
          const altMutation = `mutation CrearQuestionarioResolver($moduloId: String!) { crearQuestionarioResolver(moduloId: $moduloId) { message } }`;
          const altPayload = { query: altMutation, variables: { moduloId: String(moduloId) } };
          console.debug('AppSync request - CrearQuestionarioResolver payload:', altPayload);
          const altResp = await fetch(appsyncUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': appsyncKey,
            },
            body: JSON.stringify(altPayload),
          });

          let altJson: unknown = null;
          try {
            altJson = await altResp.json();
          } catch {
            const txt = await altResp.text().catch(() => '<non-text response>');
            const altMsg = `HTTP ${altResp.status} - no JSON response: ${txt}`;
            setError(altMsg);
            throw new Error(altMsg);
          }

          const altParsed = altJson as { errors?: Array<{ message?: string }>; data?: Record<string, unknown> };

          if (altParsed.errors) {
            const altMessage = altParsed.errors[0]?.message || 'GraphQL error (alt)';
            setError(altMessage);
            throw new Error(altMessage);
          }

          // El resolver alternativo devuelve { message: string }
          const altData = altParsed.data?.crearQuestionarioResolver as unknown;
          const maybeMsg = (altData && typeof altData === 'object' && 'message' in (altData as Record<string, unknown>)) ? (altData as Record<string, unknown>)['message'] : undefined;
          const msg = typeof maybeMsg === 'string' ? maybeMsg : undefined;
          return msg ? { message: msg } : {};
        }

        setError(message);
        throw new Error(message);
      }

      if (parsed.errors) {
        const message = parsed.errors[0]?.message || 'GraphQL error';

        if (message.includes('FieldUndefined') && message.includes('crearQuestionario')) {
          const altMutation = `mutation CrearQuestionarioResolver($moduloId: String!) { crearQuestionarioResolver(moduloId: $moduloId) { message } }`;
          const altResp = await fetch(appsyncUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': appsyncKey,
            },
            body: JSON.stringify({ query: altMutation, variables: { moduloId: String(moduloId) } }),
          });

          let altJson: unknown = null;
          try {
            altJson = await altResp.json();
          } catch {
            const txt = await altResp.text().catch(() => '<non-text response>');
            const altMsg = `HTTP ${altResp.status} - no JSON response: ${txt}`;
            setError(altMsg);
            throw new Error(altMsg);
          }

          const altParsed = altJson as { errors?: Array<{ message?: string }>; data?: Record<string, unknown> };

          if (altParsed.errors) {
            const altMessage = altParsed.errors[0]?.message || 'GraphQL error (alt)';
            setError(altMessage);
            throw new Error(altMessage);
          }

          const altData2 = altParsed.data?.crearQuestionarioResolver as unknown;
          const maybeMsg2 = (altData2 && typeof altData2 === 'object' && 'message' in (altData2 as Record<string, unknown>)) ? (altData2 as Record<string, unknown>)['message'] : undefined;
          const msg2 = typeof maybeMsg2 === 'string' ? maybeMsg2 : undefined;
          return msg2 ? { message: msg2 } : {};
        }

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
