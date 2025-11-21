import { useState, useCallback, useEffect, useRef } from "react";
import { generateClient } from "aws-amplify/api";
import { generateClient as generateDataClient } from "aws-amplify/data";
import { ResolversTypes } from "@/utils/api/resolverSchema";
import { MainSchema } from "@/utils/api/schema";
import { getGlobalCache } from "@/utils/commons/queries/cache";

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

export interface CrearQuestionarioFinalResponse {
  message?: string;
  executionArn?: string | null;
  cursoId?: string | null;
  cuestionarioId?: string | null;
  status?: string | null;
}

export interface UseCrearQuestionarioFinalParams {
  onSuccess?: () => void;
}

export const useCrearQuestionarioFinal = (
  params?: UseCrearQuestionarioFinalParams
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWaitingForWorkflow, setIsWaitingForWorkflow] = useState(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const currentCuestionarioIdRef = useRef<string | null>(null);

  const crear = useCallback(
    async (cursoId: string): Promise<CrearQuestionarioFinalResponse> => {
      console.log(
        `🚀 [useCrearQuestionarioFinal] Starting final quiz creation for cursoId: ${cursoId}`
      );
      setLoading(true);
      setError(null);
      try {
        const client = getClient();
        console.log(
          "📤 [useCrearQuestionarioFinal] Calling crearQuestionarioFinalResolver mutation"
        );
        const { data, errors } =
          await client.mutations.crearQuestionarioFinalResolver({
            cursoId: cursoId,
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
          const message = "No se pudo crear el cuestionario final";
          setError(message);
          throw new Error(message);
        }

        const response = data as CrearQuestionarioFinalResponse;

        console.log("📝 [useCrearQuestionarioFinal] Mutation response:", {
          cursoId: response.cursoId,
          cuestionarioId: response.cuestionarioId,
          executionArn: response.executionArn,
          status: response.status,
        });

        // If status is "EXISTS", call success immediately and return
        if (response.status === "EXISTS") {
          console.log(
            "✅ [useCrearQuestionarioFinal] Cuestionario already exists, calling onSuccess immediately"
          );
          // Invalidate cache for Curso model
          const cache = getGlobalCache();
          cache.invalidatePattern("Curso:");
          console.log("Cache invalidated for Curso model");

          if (params?.onSuccess) {
            params.onSuccess();
          }
          return response;
        }

        // If cuestionarioId is returned and status is not "EXISTS", set up subscription to monitor workflow_status
        if (response.cuestionarioId) {
          console.log(
            `🔔 [useCrearQuestionarioFinal] Setting up subscription for cuestionarioId: ${response.cuestionarioId}`
          );
          currentCuestionarioIdRef.current = response.cuestionarioId;
          setIsWaitingForWorkflow(true);
          setError(null);

          // Clean up any existing subscription
          if (subscriptionRef.current) {
            console.log(
              "🧹 [useCrearQuestionarioFinal] Cleaning up existing subscription"
            );
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
          }

          try {
            const dataClient = getDataClient();
            console.log(
              "📡 [useCrearQuestionarioFinal] Getting data client for subscriptions"
            );
            // Access Cuestionario model from the client
            const cuestionarioModel = (
              dataClient.models as Record<string, unknown>
            )["Cuestionario"] as {
              onUpdate: (args?: {
                filter?: {
                  cuestionarioId?: { eq?: string };
                };
                selectionSet?: readonly string[];
              }) => {
                subscribe: (handlers: {
                  next: (data: unknown) => void;
                  error: (error: unknown) => void;
                }) => { unsubscribe: () => void };
              };
            };

            if (!cuestionarioModel) {
              throw new Error("Cuestionario model not found in data client");
            }

            console.log(
              `✅ [useCrearQuestionarioFinal] Cuestionario model found, creating onUpdate subscription for cuestionarioId: ${response.cuestionarioId}`
            );
            console.log(
              `🔍 [useCrearQuestionarioFinal] Will listen for ALL cuestionario updates and filter for cuestionarioId: ${response.cuestionarioId}`
            );

            // Define selectionSet to ensure workflow_status is included in subscription updates
            const workflowStatusSelectionSet = [
              "cuestionarioId",
              "workflow_status",
            ] as const;

            console.log(
              `📋 [useCrearQuestionarioFinal] Using selectionSet to request: cuestionarioId, workflow_status`
            );

            // Subscribe to all cuestionario updates and filter in the handler
            const subscription = cuestionarioModel
              .onUpdate({
                selectionSet: workflowStatusSelectionSet,
              })
              .subscribe({
                next: (updatedCuestionario: unknown) => {
                  console.log(
                    `📨 [useCrearQuestionarioFinal] Raw subscription update received:`,
                    updatedCuestionario
                  );

                  const cuestionario = updatedCuestionario as {
                    cuestionarioId?: string;
                    workflow_status?:
                      | "pending"
                      | "in_progress"
                      | "completed"
                      | "failed"
                      | null;
                  };

                  console.log(
                    `📨 [useCrearQuestionarioFinal] Parsed update - cuestionarioId: ${cuestionario?.cuestionarioId}, workflow_status: ${cuestionario?.workflow_status}, expected cuestionarioId: ${response.cuestionarioId}`
                  );

                  // Filter by cuestionarioId in the handler
                  if (!cuestionario || !cuestionario.cuestionarioId) {
                    console.log(
                      `⏭️ [useCrearQuestionarioFinal] Ignoring update - missing cuestionario or cuestionarioId`
                    );
                    return;
                  }

                  if (cuestionario.cuestionarioId !== response.cuestionarioId) {
                    console.log(
                      `⏭️ [useCrearQuestionarioFinal] Ignoring update - cuestionarioId mismatch: got ${cuestionario.cuestionarioId}, expected ${response.cuestionarioId}`
                    );
                    return;
                  }

                  console.log(
                    `✅ [useCrearQuestionarioFinal] Cuestionario ID matches! Processing update for cuestionarioId: ${cuestionario.cuestionarioId}`
                  );

                  const workflowStatus = cuestionario.workflow_status;
                  console.log(
                    `🔄 [useCrearQuestionarioFinal] Processing workflow_status: ${workflowStatus}`
                  );

                  if (workflowStatus === "completed") {
                    // Workflow completed successfully
                    console.log(
                      `✅ [useCrearQuestionarioFinal] Workflow completed successfully for cuestionarioId: ${response.cuestionarioId}`
                    );
                    setIsWaitingForWorkflow(false);
                    if (subscriptionRef.current) {
                      console.log(
                        "🧹 [useCrearQuestionarioFinal] Unsubscribing after successful completion"
                      );
                      subscriptionRef.current.unsubscribe();
                      subscriptionRef.current = null;
                    }

                    // Invalidate cache for Curso model since it now has a new final quiz
                    const cache = getGlobalCache();
                    cache.invalidatePattern("Curso:");
                    console.log("Cache invalidated for Curso model");

                    // Call success callback if provided
                    if (params?.onSuccess) {
                      console.log(
                        "✅ [useCrearQuestionarioFinal] Calling onSuccess callback"
                      );
                      params.onSuccess();
                    }
                  } else if (workflowStatus === "failed") {
                    // Workflow failed
                    console.error(
                      `❌ [useCrearQuestionarioFinal] Workflow failed for cuestionarioId: ${response.cuestionarioId}`
                    );
                    setIsWaitingForWorkflow(false);
                    setError(
                      "Error al procesar el cuestionario. El proceso de creación falló."
                    );
                    if (subscriptionRef.current) {
                      console.log(
                        "🧹 [useCrearQuestionarioFinal] Unsubscribing after failure"
                      );
                      subscriptionRef.current.unsubscribe();
                      subscriptionRef.current = null;
                    }
                  } else {
                    // Status is "pending" or "in_progress"
                    console.log(
                      `⏳ [useCrearQuestionarioFinal] Workflow still in progress: ${workflowStatus} - continuing to wait...`
                    );
                  }
                },
                error: (subscriptionError: unknown) => {
                  console.error(
                    "❌ [useCrearQuestionarioFinal] Subscription error:",
                    subscriptionError
                  );
                  setIsWaitingForWorkflow(false);
                  setError(
                    "Error al monitorear el estado del cuestionario. Por favor, verifica manualmente."
                  );
                  if (subscriptionRef.current) {
                    console.log(
                      "🧹 [useCrearQuestionarioFinal] Unsubscribing after subscription error"
                    );
                    subscriptionRef.current.unsubscribe();
                    subscriptionRef.current = null;
                  }
                },
              });

            subscriptionRef.current = subscription;
            console.log(
              `✅ [useCrearQuestionarioFinal] Subscription established successfully.`
            );
            console.log(
              `⏳ [useCrearQuestionarioFinal] Waiting for workflow_status updates for cuestionarioId: ${response.cuestionarioId}...`
            );
          } catch (subscriptionSetupError) {
            console.error(
              "❌ [useCrearQuestionarioFinal] Error setting up subscription:",
              subscriptionSetupError
            );
            setIsWaitingForWorkflow(false);
            setError(
              "Error al configurar monitoreo del cuestionario. Por favor, verifica manualmente."
            );
          }
        } else {
          // No cuestionarioId returned, call success callback immediately if provided
          if (params?.onSuccess) {
            console.log(
              "✅ Cuestionario created successfully, calling onSuccess callback"
            );
            params.onSuccess();
          }
        }

        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ [useCrearQuestionarioFinal] Error in crear:", err);
        setError(message);
        setIsWaitingForWorkflow(false);
        // Clean up subscription if it exists
        if (subscriptionRef.current) {
          console.log(
            "🧹 [useCrearQuestionarioFinal] Cleaning up subscription after error"
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
          "🧹 [useCrearQuestionarioFinal] Component unmounting, cleaning up subscription"
        );
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []);

  return { loading, error, crear, isWaitingForWorkflow } as const;
};
