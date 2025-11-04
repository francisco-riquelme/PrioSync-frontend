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

export interface CreateCourseFromPlaylistResponse {
  message?: string;
  executionArn?: string | null;
  cursoId?: string | null;
  playlistId?: string | null;
  usuarioId?: string | null;
  status?: string | null;
}

export interface UseCreateCourseFromPlaylistParams {
  onSuccess?: (response: CreateCourseFromPlaylistResponse) => void;
}

export const useCreateCourseFromPlaylist = (
  params?: UseCreateCourseFromPlaylistParams
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCourse = useCallback(
    async (
      playlistId: string,
      usuarioId: string
    ): Promise<CreateCourseFromPlaylistResponse> => {
      setLoading(true);
      setError(null);
      try {
        const client = getClient();
        const { data, errors } =
          await client.mutations.createCourseFromPlaylistResolver({
            playlistId: playlistId,
            usuarioId: usuarioId,
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
          const message = "No se pudo crear el curso";
          setError(message);
          throw new Error(message);
        }

        // Call success callback if provided
        if (params?.onSuccess) {
          console.log(
            "✅ Course created successfully, calling onSuccess callback"
          );
          params.onSuccess(data as CreateCourseFromPlaylistResponse);
        } else {
          console.log(
            "✅ Course created successfully, but no onSuccess callback provided"
          );
        }

        return data as CreateCourseFromPlaylistResponse;
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

  return { loading, error, createCourse } as const;
};
