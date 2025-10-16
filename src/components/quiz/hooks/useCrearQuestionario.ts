import { useState, useCallback } from "react";

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
      const res = await fetch('/api/crear-questionario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduloId }),
      });

      const json: CrearQuestionarioResponse = await res.json();

      if (!res.ok) {
        const missing = Array.isArray(json?.missing) ? json.missing : undefined;
        const msg = json?.message || 'Error al crear el cuestionario';
        const err = new Error(msg + (missing ? `: ${missing.join(', ')}` : ''));
        setError(String(err));
        throw err;
      }

      return json || {};
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, crear } as const;
};
