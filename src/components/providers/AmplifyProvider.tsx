'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AmplifyOutputsType, initializeQueries, AmplifyModelType } from "@/utils/commons/queries";
import amplifyOutputs from "../../../amplify_outputs.json";
import { MainSchema } from "@/utils/api/schema";

interface AmplifyProviderProps {
  children: React.ReactNode;
}

interface AmplifyContextType {
  isInitialized: boolean;
}

const AmplifyContext = createContext<AmplifyContextType>({ isInitialized: false });

export const useAmplify = () => useContext(AmplifyContext);

export default function AmplifyProvider({ children }: AmplifyProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAmplify = async () => {
      try {
        // initializeQueries handles both Amplify configuration and client initialization
        await initializeQueries<typeof MainSchema, Record<string, AmplifyModelType>>({
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

  return (
    <AmplifyContext.Provider value={{ isInitialized }}>
      {children}
    </AmplifyContext.Provider>
  );
}
