import { useState, useCallback, useEffect, useRef } from "react";
import { generateClient } from "aws-amplify/api";
import { generateClient as generateDataClient } from "aws-amplify/data";
import { ResolversTypes } from "@/utils/api/resolverSchema";
import { MainSchema } from "@/utils/api/schema";

let _client: ReturnType<typeof generateClient<ResolversTypes>> | null = null;
function getClient() {
  if (!_client) {
    _client = generateClient<ResolversTypes>();
  }
  return _client;
}

let _dataClient: ReturnType<
  typeof generateDataClient<typeof MainSchema>
> | null = null;
function getDataClient() {
  if (!_dataClient) {
    _dataClient = generateDataClient<typeof MainSchema>();
  }
  return _dataClient;
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
  const [isWaitingForWorkflow, setIsWaitingForWorkflow] = useState(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const currentCursoIdRef = useRef<string | null>(null);

  const createCourse = useCallback(
    async (
      playlistId: string,
      usuarioId: string
    ): Promise<CreateCourseFromPlaylistResponse> => {
      console.log(
        `🚀 [useCreateCourseFromPlaylist] Starting course creation for playlistId: ${playlistId}, usuarioId: ${usuarioId}`
      );
      setLoading(true);
      setError(null);
      try {
        const client = getClient();
        console.log(
          "📤 [useCreateCourseFromPlaylist] Calling createCourseFromPlaylistResolver mutation"
        );
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

        const response = data as CreateCourseFromPlaylistResponse;

        console.log("📝 [useCreateCourseFromPlaylist] Mutation response:", {
          cursoId: response.cursoId,
          executionArn: response.executionArn,
          status: response.status,
        });

        // If cursoId is returned, set up subscription to monitor workflow_status
        if (response.cursoId) {
          console.log(
            `🔔 [useCreateCourseFromPlaylist] Setting up subscription for cursoId: ${response.cursoId}`
          );
          currentCursoIdRef.current = response.cursoId;
          setIsWaitingForWorkflow(true);
          setError(null);

          // Clean up any existing subscription
          if (subscriptionRef.current) {
            console.log(
              "🧹 [useCreateCourseFromPlaylist] Cleaning up existing subscription"
            );
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
          }

          try {
            const dataClient = getDataClient();
            console.log(
              "📡 [useCreateCourseFromPlaylist] Getting data client for subscriptions"
            );
            // Access Curso model from the client
            const cursoModel = (dataClient.models as Record<string, unknown>)[
              "Curso"
            ] as {
              onUpdate: (args?: {
                filter?: {
                  cursoId?: { eq?: string };
                };
                selectionSet?: readonly string[];
              }) => {
                subscribe: (handlers: {
                  next: (data: unknown) => void;
                  error: (error: unknown) => void;
                }) => { unsubscribe: () => void };
              };
            };

            if (!cursoModel) {
              throw new Error("Curso model not found in data client");
            }

            console.log(
              `✅ [useCreateCourseFromPlaylist] Curso model found, creating onUpdate subscription for cursoId: ${response.cursoId}`
            );
            console.log(
              `🔍 [useCreateCourseFromPlaylist] Will listen for ALL curso updates and filter for cursoId: ${response.cursoId}`
            );

            // Define selectionSet to ensure workflow_status is included in subscription updates
            const workflowStatusSelectionSet = [
              "cursoId",
              "workflow_status",
            ] as const;

            console.log(
              `📋 [useCreateCourseFromPlaylist] Using selectionSet to request: cursoId, workflow_status`
            );

            // Subscribe to all curso updates and filter in the handler
            // This ensures we receive all updates and can debug if filtering is the issue
            // Include selectionSet to ensure workflow_status field is returned
            const subscription = cursoModel
              .onUpdate({
                selectionSet: workflowStatusSelectionSet,
              })
              .subscribe({
                next: (updatedCourse: unknown) => {
                  console.log(
                    `📨 [useCreateCourseFromPlaylist] Raw subscription update received:`,
                    updatedCourse
                  );

                  // Log all keys in the received object to debug
                  if (updatedCourse && typeof updatedCourse === "object") {
                    const keys = Object.keys(updatedCourse);
                    console.log(
                      `🔑 [useCreateCourseFromPlaylist] Available fields in update:`,
                      keys
                    );
                    console.log(
                      `🔍 [useCreateCourseFromPlaylist] Checking for workflow_status field...`
                    );
                    if ("workflow_status" in updatedCourse) {
                      console.log(
                        `✅ [useCreateCourseFromPlaylist] workflow_status found:`,
                        (updatedCourse as Record<string, unknown>)[
                          "workflow_status"
                        ]
                      );
                    } else {
                      console.warn(
                        `⚠️ [useCreateCourseFromPlaylist] workflow_status field NOT found in subscription update!`
                      );
                    }
                  }

                  const course = updatedCourse as {
                    cursoId?: string;
                    workflow_status?:
                      | "pending"
                      | "in_progress"
                      | "completed"
                      | "failed"
                      | null;
                  };

                  console.log(
                    `📨 [useCreateCourseFromPlaylist] Parsed update - cursoId: ${course?.cursoId}, workflow_status: ${course?.workflow_status}, expected cursoId: ${response.cursoId}`
                  );

                  // Filter by cursoId in the handler
                  if (!course || !course.cursoId) {
                    console.log(
                      `⏭️ [useCreateCourseFromPlaylist] Ignoring update - missing course or cursoId`
                    );
                    return;
                  }

                  if (course.cursoId !== response.cursoId) {
                    console.log(
                      `⏭️ [useCreateCourseFromPlaylist] Ignoring update - cursoId mismatch: got ${course.cursoId}, expected ${response.cursoId}`
                    );
                    return;
                  }

                  console.log(
                    `✅ [useCreateCourseFromPlaylist] Course ID matches! Processing update for cursoId: ${course.cursoId}`
                  );

                  const workflowStatus = course.workflow_status;
                  console.log(
                    `🔄 [useCreateCourseFromPlaylist] Processing workflow_status: ${workflowStatus}`
                  );

                  if (workflowStatus === "completed") {
                    // Workflow completed successfully
                    console.log(
                      `✅ [useCreateCourseFromPlaylist] Workflow completed successfully for cursoId: ${response.cursoId}`
                    );
                    setIsWaitingForWorkflow(false);
                    if (subscriptionRef.current) {
                      console.log(
                        "🧹 [useCreateCourseFromPlaylist] Unsubscribing after successful completion"
                      );
                      subscriptionRef.current.unsubscribe();
                      subscriptionRef.current = null;
                    }

                    // Call success callback if provided
                    if (params?.onSuccess) {
                      console.log(
                        "✅ [useCreateCourseFromPlaylist] Calling onSuccess callback"
                      );
                      params.onSuccess(response);
                    }
                  } else if (workflowStatus === "failed") {
                    // Workflow failed
                    console.error(
                      `❌ [useCreateCourseFromPlaylist] Workflow failed for cursoId: ${response.cursoId}`
                    );
                    setIsWaitingForWorkflow(false);
                    setError(
                      "Error al procesar el curso. El proceso de creación falló."
                    );
                    if (subscriptionRef.current) {
                      console.log(
                        "🧹 [useCreateCourseFromPlaylist] Unsubscribing after failure"
                      );
                      subscriptionRef.current.unsubscribe();
                      subscriptionRef.current = null;
                    }
                  } else {
                    // Status is "pending" or "in_progress"
                    console.log(
                      `⏳ [useCreateCourseFromPlaylist] Workflow still in progress: ${workflowStatus} - continuing to wait...`
                    );
                  }
                },
                error: (subscriptionError: unknown) => {
                  console.error(
                    "❌ [useCreateCourseFromPlaylist] Subscription error:",
                    subscriptionError
                  );
                  setIsWaitingForWorkflow(false);
                  setError(
                    "Error al monitorear el estado del curso. Por favor, verifica manualmente."
                  );
                  if (subscriptionRef.current) {
                    console.log(
                      "🧹 [useCreateCourseFromPlaylist] Unsubscribing after subscription error"
                    );
                    subscriptionRef.current.unsubscribe();
                    subscriptionRef.current = null;
                  }
                },
              });

            subscriptionRef.current = subscription;
            console.log(
              `✅ [useCreateCourseFromPlaylist] Subscription established successfully.`
            );
            console.log(
              `📡 [useCreateCourseFromPlaylist] Subscription object:`,
              subscription
            );
            console.log(
              `⏳ [useCreateCourseFromPlaylist] Waiting for workflow_status updates for cursoId: ${response.cursoId}...`
            );
            console.log(
              `💡 [useCreateCourseFromPlaylist] The subscription will trigger when the Curso with cursoId "${response.cursoId}" is updated, including when workflow_status changes to "completed" or "failed".`
            );
          } catch (subscriptionSetupError) {
            console.error(
              "❌ [useCreateCourseFromPlaylist] Error setting up subscription:",
              subscriptionSetupError
            );
            setIsWaitingForWorkflow(false);
            setError(
              "Error al configurar monitoreo del curso. Por favor, verifica manualmente."
            );
          }
        } else {
          // No cursoId returned, call success callback immediately if provided
          if (params?.onSuccess) {
            console.log(
              "✅ Course created successfully, calling onSuccess callback"
            );
            params.onSuccess(response);
          }
        }

        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          "❌ [useCreateCourseFromPlaylist] Error in createCourse:",
          err
        );
        setError(message);
        setIsWaitingForWorkflow(false);
        // Clean up subscription if it exists
        if (subscriptionRef.current) {
          console.log(
            "🧹 [useCreateCourseFromPlaylist] Cleaning up subscription after error"
          );
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        console.log(
          "🧹 [useCreateCourseFromPlaylist] Component unmounting, cleaning up subscription"
        );
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []);

  return { loading, error, createCourse, isWaitingForWorkflow } as const;
};
