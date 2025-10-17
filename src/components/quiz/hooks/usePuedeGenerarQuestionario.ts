import { useState, useCallback } from "react";

export interface PuedeGenerarResponse {
  canGenerate?: boolean;
  reason?: string;
  message?: string;
}

export const usePuedeGenerarQuestionario = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(
    async (_moduloId: string): Promise<PuedeGenerarResponse> => {
      setLoading(true);
      setError(null);
      try {
        // For now, we'll need to get the module data and calculate completion
        // This is a simplified version - in a real implementation, you might want to
        // create a resolver on the backend that does this calculation

        // Since we don't have access to the module data here, we'll return true
        // The actual 70% check should be done in the CourseLessons component
        // where we have access to the module data and can use useProgresoModulo
        return { canGenerate: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, check } as const;
};
