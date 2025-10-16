import { useState, useCallback } from "react";

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
      const res = await fetch(`/api/puede-generar-questionario?moduloId=${encodeURIComponent(moduloId)}`);
      let json: PuedeGenerarResponse | null = null;
      try {
        json = await res.json();
      } catch {
        // ignore JSON parse errors
      }

      if (!res.ok) {
        const msg = json?.message || `Error al comprobar la generación del cuestionario`;
        const missing = Array.isArray(json?.missing) ? json?.missing : undefined;
        const err = new Error(msg + (missing ? `: ${missing.join(', ')}` : ''));
        setError(String(err));
        throw err;
      }

      return json || {};
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
