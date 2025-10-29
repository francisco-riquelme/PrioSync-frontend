'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { getQueryFactories } from '@/utils/commons/queries';
import type { MainTypes } from '@/utils/api/schema';
import { useAmplify } from '@/components/providers/AmplifyProvider';

// Import schema types
type Usuario = MainTypes["Usuario"]["type"];

// Define types for curso with relations (matching SelectionSet return types exactly)
interface CursoFromUsuario {
  readonly cursoId: string;
  readonly titulo: string;
  readonly descripcion: string | null;
  readonly imagen_portada: string | null;
  readonly duracion_estimada: number | null;
  readonly nivel_dificultad: "basico" | "intermedio" | "avanzado" | null;
  readonly estado: "activo" | "inactivo" | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface UsuarioWithRelations {
  usuarioId: string;
  email: string;
  nombre?: string | null;
  apellido?: string | null;
  ultimo_login?: string | null;
  isValid?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  Cursos?: CursoFromUsuario[];
}

// Simplified InscripcionCurso for client-side (without lazy loaders)
export interface InscripcionCurso {
  usuarioId: string;
  cursoId: string;
  fecha_inscripcion?: string | null;
  estado?: 'en_progreso' | 'completado' | 'abandonado' | 'inscrito' | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  
  // Helper properties for UI display (populated from Curso data)
  curso_titulo?: string;
}

// Extended user data with additional UI fields
export interface UserData {
  // Schema fields from Usuario model
  usuarioId: string;
  email: string;
  nombre: string;
  apellido?: string | null;
  ultimo_login?: string | null;
  isValid?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  
  // UI-specific fields
  avatar?: string;
  
  // Relationships (simplified for client-side use)
  Cursos?: CursoFromUsuario[];
  InscripcionesCurso?: InscripcionCurso[];
  activities?: Activity[];
}

// Legacy interface for backward compatibility
export interface CourseProgress {
  courseId: string;
  courseName: string;
  progress: number;
  lastAccessed: string;
}

export interface Activity {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  type: 'course_completed' | 'module_completed' | 'evaluation_completed' | 'assignment_completed';
}

// Context interface
interface UserContextType {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  updateUser: (updates: Partial<UserData>) => Promise<void>;
  updateCourseProgress: (courseId: string, progress: number) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id' | 'date'>) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Selection set for fetching user data from database
const userSelectionSet = [
  'usuarioId',
  'email',
  'nombre',
  'apellido',
  'ultimo_login',
  'isValid',
  'createdAt',
  'updatedAt',
  'Cursos.cursoId',
  'Cursos.titulo',
  'Cursos.descripcion',
  'Cursos.imagen_portada',
  'Cursos.duracion_estimada',
  'Cursos.nivel_dificultad',
  'Cursos.estado',
  'Cursos.createdAt',
  'Cursos.updatedAt',
] as const;

// UsuarioWithRelations type is defined above

// Function to fetch user data from database
const fetchUserFromDatabase = async (usuarioId: string): Promise<UserData | null> => {
  try {
    const { Usuario } = await getQueryFactories<
      Pick<MainTypes, "Usuario">,
      "Usuario"
    >({
      entities: ["Usuario"],
    });

    const userRes = (await Usuario.get({
      input: { usuarioId },
      selectionSet: userSelectionSet,
    })) as unknown as UsuarioWithRelations;

    if (!userRes) {
      return null;
    }

    // Transform database response to UserData format
    const userData: UserData = {
      usuarioId: userRes.usuarioId,
      email: userRes.email,
      nombre: userRes.nombre || '',
      apellido: userRes.apellido,
      ultimo_login: userRes.ultimo_login,
      isValid: userRes.isValid,
      createdAt: userRes.createdAt,
      updatedAt: userRes.updatedAt,
      avatar: userRes.nombre ? userRes.nombre.charAt(0).toUpperCase() : 'U',
      
      // Map courses from database response
      Cursos: userRes.Cursos || [],
      
      // TODO: Load courses separately - LazyLoader needs special handling
      InscripcionesCurso: [],
      
      // Activities are UI-only for now (not persisted to DB)
      activities: [],
    };

    return userData;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    return null;
  }
};

// Provider
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized } = useAmplify();

  // Check authentication and load user data on initialization
  useEffect(() => {
    // Don't run if Amplify is not initialized yet
    if (!isInitialized) {
      console.log('⏳ Waiting for Amplify to initialize...');
      return;
    }

    const checkAuthAndLoadUser = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check AWS Amplify auth session
        const session = await fetchAuthSession();
        
        if (session.tokens) {
          // User is authenticated, get user info
          const cognitoUser = await getCurrentUser();
          const usuarioId = cognitoUser.userId;
          
          // Fetch user data from database
          const userData = await fetchUserFromDatabase(usuarioId);
          
          if (userData) {
            setUserData(userData);
          } else {
            // User exists in Cognito but not in database
            // This could happen if postConfirmation trigger failed
            setError('Usuario no encontrado en la base de datos. Por favor contacta soporte.');
            setUserData(null);
          }
        } else {
          // No auth session, user not logged in
          setUserData(null);
        }
      } catch (err) {
        console.error('Error checking auth or loading user data:', err);
        setError('Error al verificar autenticación');
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadUser();
  }, [isInitialized]); // Run when Amplify initialization status changes

  // Refresh user data from database
  const refreshUser = async (): Promise<void> => {
    // Ensure Amplify is initialized before attempting operations
    if (!isInitialized) {
      console.error('Cannot refresh user: Amplify not initialized');
      setError('Sistema no inicializado. Por favor recarga la página.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Check auth session again
      const session = await fetchAuthSession();
      
      if (session.tokens) {
        const cognitoUser = await getCurrentUser();
        const usuarioId = cognitoUser.userId;
        
        // Fetch fresh user data from database
        const userData = await fetchUserFromDatabase(usuarioId);
        
        if (userData) {
          setUserData(userData);
        } else {
          setError('Usuario no encontrado en la base de datos');
          setUserData(null);
        }
      } else {
        // No auth session
        setUserData(null);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError('Error al actualizar datos');
    } finally {
      setLoading(false);
    }
  };

  // Clear user data (for logout)
  const clearUserData = (): void => {
    setUserData(null);
    setError(null);
  };

  // Update user (for profile updates)
  const updateUser = async (updates: Partial<UserData>): Promise<void> => {
    if (!userData) {
      throw new Error('No hay datos de usuario para actualizar');
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Contexto: Iniciando actualización de usuario...', {
        usuarioId: userData.usuarioId,
        updates
      });

      const { Usuario } = await getQueryFactories<
        Pick<MainTypes, "Usuario">,
        "Usuario"
      >({
        entities: ["Usuario"],
      });

          // Preparar los datos para actualizar en la BD
          const updateData: Partial<Pick<UserData, 'nombre' | 'apellido'>> = {};
      
      if (updates.nombre !== undefined) updateData.nombre = updates.nombre;
      if (updates.apellido !== undefined) updateData.apellido = updates.apellido;
      
      console.log('🔄 Contexto: Datos a actualizar en BD:', updateData);
      
      // Actualizar en la base de datos
      const result = await Usuario.update({
        input: {
          usuarioId: userData.usuarioId,
          ...updateData
        }
      });

      console.log('🔄 Contexto: Resultado de la actualización:', result);

      // Actualizar el estado local inmediatamente después de la actualización exitosa
      setUserData(prev => {
        if (!prev) return null;
        
        const updatedData = {
          ...prev,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        console.log('🔄 Contexto: Estado local actualizado inmediatamente:', updatedData);
        return updatedData;
      });

      console.log('✅ Usuario actualizado exitosamente en la base de datos');
    } catch (err) {
      console.error('❌ Contexto: Error updating user:', err);
      setError('Error al actualizar usuario en la base de datos');
      throw err; // Re-throw para que el componente pueda manejar el error
    } finally {
      setLoading(false);
    }
  };

  // Update course progress (updates InscripcionCurso)
  const updateCourseProgress = async (courseId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Implement actual API call to update course progress
      // For now, just update local state
      setUserData(prev => {
        if (!prev) return null;
        
        const updatedInscripciones = prev.InscripcionesCurso?.map(inscripcion => 
          inscripcion.cursoId === courseId 
            ? { 
                ...inscripcion, 
                updatedAt: new Date().toISOString(),
              }
            : inscripcion
        );
        
        return {
          ...prev,
          InscripcionesCurso: updatedInscripciones,
          updatedAt: new Date().toISOString()
        };
      });
    } catch (err) {
      console.error('Error updating course progress:', err);
      setError('Error al actualizar progreso del curso');
    } finally {
      setLoading(false);
    }
  };

  // Add activity (UI-only for now)
  const addActivity = async (activity: Omit<Activity, 'id' | 'date'>): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Generate id and date only on client to avoid SSR mismatch
      let id = '';
      let date = '';
      if (typeof window !== 'undefined') {
        id = `activity_${Date.now()}`;
        date = new Date().toLocaleDateString('es-ES');
      } else {
        id = '';
        date = '';
      }

      const newActivity: Activity = {
        ...activity,
        id,
        date
      };

      setUserData(prev => {
        if (!prev) return null;

        return {
          ...prev,
          activities: [newActivity, ...(prev.activities || [])],
          updatedAt: typeof window !== 'undefined' ? new Date().toISOString() : prev.updatedAt
        };
      });
    } catch (err) {
      console.error('Error adding activity:', err);
      setError('Error al agregar actividad');
    } finally {
      setLoading(false);
    }
  };

  const value: UserContextType = {
    userData,
    loading,
    error,
    updateUser,
    updateCourseProgress,
    addActivity,
    refreshUser,
    clearUserData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
