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

export interface CrearMaterialResponse {
  materialId?: string;
  message?: string;
}

export interface UseCrearMaterialParams {
  onSuccess?: (materialId?: string) => void;
}

export const useCrearMaterial = (params?: UseCrearMaterialParams) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = useCallback(
    async (moduloId: string, modoGeneracion?: string): Promise<CrearMaterialResponse> => {
      setLoading(true);
      setError(null);
      try {
        const client = getClient();
        // Defensive check: ensure the generated client exposes the resolver method.
        if (!client.mutations || typeof client.mutations.crearMaterialResolver !== 'function') {
          // Log available mutation keys to help debugging in the browser console
          // (useful when dev server needs restart or schema wasn't picked up).
           
          console.error('crearMaterialResolver no está disponible en client.mutations. Claves disponibles:',
            client.mutations ? Object.keys(client.mutations) : client.mutations);
          throw new Error('La mutación crearMaterialResolver no está disponible en el cliente GraphQL. Reinicia el servidor de desarrollo para recargar el esquema.');
        }

        const variables: Record<string, unknown> = { moduloId: moduloId };
        if (modoGeneracion) variables.modoGeneracion = modoGeneracion;

  const { data, errors } = await client.mutations.crearMaterialResolver(variables as { moduloId: string; modoGeneracion?: string });

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
          const message = "No se pudo crear el material";
          setError(message);
          throw new Error(message);
        }

        const materialId = (data as unknown as CrearMaterialResponse).materialId;

        if (params?.onSuccess) {
          params.onSuccess(materialId);
        }

        // Invalidate Curso cache so UI refreshes
        const cache = getGlobalCache();
        cache.invalidatePattern("Curso:");

        return data as CrearMaterialResponse;
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

export default useCrearMaterial;
