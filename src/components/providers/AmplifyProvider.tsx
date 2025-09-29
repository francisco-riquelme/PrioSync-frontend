'use client';

import { useEffect, useState } from 'react';
import { AmplifyOutputsType, initializeQueries, ClientManager } from "@/utils/commons/queries";
import amplifyOutputs from "../../../amplify_outputs.json";
import { MainSchema, MainTypes } from "@/utils/api/schema";

interface AmplifyProviderProps {
  children: React.ReactNode;
}

export default function AmplifyProvider({ children }: AmplifyProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAmplify = async () => {
      try {
        // Initialize the Amplify client
        await ClientManager.getInstance("default").getClient<MainTypes>();

        // Initialize query factories
        await initializeQueries<typeof MainSchema, MainTypes>({
          amplifyOutputs: amplifyOutputs as unknown as AmplifyOutputsType,
          schema: MainSchema,
          cache: { enabled: true, maxSize: 50 * 1024 * 1024 },
          clientKey: "default"
        });

        setIsInitialized(true);
        console.log('✅ Amplify initialized successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('❌ Failed to initialize Amplify:', errorMessage);
      }
    };

    initializeAmplify();
  }, []);

  // Show loading state while initializing
  if (!isInitialized && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing database connection...</p>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
          <div className="text-red-600 mb-2">⚠️ Database Connection Error</div>
          <p className="text-sm text-red-800 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render children only after successful initialization
  return <>{children}</>;
}
