'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { MainTypes } from '@/utils/api/schema';

// Import schema types
type UsuarioSchema = MainTypes["Usuario"]["type"];
type InscripcionCursoSchema = MainTypes["InscripcionCurso"]["type"];

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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Default user data aligned with schema
const getDefaultUserData = (): UserData => ({
  usuarioId: 'user_francisco_riquelme',
  nombre: 'Francisco',
  apellido: 'Riquelme',
  email: 'francisco.riquelme@duocuc.cl',
  avatar: 'FR',
  isValid: true,
  ultimo_login: new Date().toISOString(),
  createdAt: '2025-08-01T10:00:00Z',
  updatedAt: new Date().toISOString(),
  
  InscripcionesCurso: [
    {
      usuarioId: 'user_francisco_riquelme',
      cursoId: 'calculo-avanzado',
      fecha_inscripcion: '2025-08-15T09:30:00Z',
      estado: 'en_progreso',
      createdAt: '2025-08-15T09:30:00Z',
      updatedAt: '2025-09-11T09:30:00Z',
      curso_titulo: 'Cálculo Avanzado',
    },
    {
      usuarioId: 'user_francisco_riquelme',
      cursoId: 'desarrollo-software',
      fecha_inscripcion: '2025-08-20T14:20:00Z',
      estado: 'en_progreso',
      createdAt: '2025-08-20T14:20:00Z',
      updatedAt: '2025-09-10T14:20:00Z',
      curso_titulo: 'Desarrollo de Software',
    },
    {
      usuarioId: 'user_francisco_riquelme',
      cursoId: 'inteligencia-artificial',
      fecha_inscripcion: '2025-08-25T16:45:00Z',
      estado: 'en_progreso',
      createdAt: '2025-08-25T16:45:00Z',
      updatedAt: '2025-09-09T16:45:00Z',
      curso_titulo: 'Inteligencia Artificial',
    },
    {
      usuarioId: 'user_francisco_riquelme',
      cursoId: 'gestion-proyectos',
      fecha_inscripcion: '2025-09-01T11:15:00Z',
      estado: 'completado',
      createdAt: '2025-09-01T11:15:00Z',
      updatedAt: '2025-09-08T11:15:00Z',
      curso_titulo: 'Gestión de Proyectos',
    }
  ],
  
  activities: [
    {
      id: 'activity_1',
      title: 'Completado: Gestión de Proyectos',
      subtitle: 'Curso Completo - Proyecto',
      date: '01/09/2025',
      type: 'course_completed'
    },
    {
      id: 'activity_2',
      title: 'HTML y CSS',
      subtitle: 'Desarrollo de Software - Módulo',
      date: '28/08/2025',
      type: 'module_completed'
    },
    {
      id: 'activity_3',
      title: 'Evaluación Módulo 1',
      subtitle: 'Cálculo Avanzado - Evaluación (100%)',
      date: '25/08/2025',
      type: 'evaluation_completed'
    },
    {
      id: 'activity_4',
      title: 'Introducción a Derivadas',
      subtitle: 'Cálculo Avanzado - Módulo',
      date: '23/08/2025',
      type: 'module_completed'
    }
  ]
});

// Provider
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on initialization
  useEffect(() => {
    const loadUserData = () => {
      setLoading(true);
      try {
        const savedData = localStorage.getItem('priosync_user_data');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setUserData(parsedData);
        } else {
          // First time - use default data
          const defaultData = getDefaultUserData();
          setUserData(defaultData);
          localStorage.setItem('priosync_user_data', JSON.stringify(defaultData));
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Error al cargar datos del usuario');
        // Fallback to default data
        const defaultData = getDefaultUserData();
        setUserData(defaultData);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Auto-save when data changes
  useEffect(() => {
    if (userData) {
      try {
        localStorage.setItem('priosync_user_data', JSON.stringify(userData));
      } catch (err) {
        console.error('Error saving user data:', err);
        setError('Error al guardar datos del usuario');
      }
    }
  }, [userData]);

  // Update user
  const updateUser = async (updates: Partial<UserData>): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUserData(prev => {
        if (!prev) return null;
        
        const updatedData = {
          ...prev,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        return updatedData;
      });
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Error al actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  // Update course progress (updates InscripcionCurso)
  const updateCourseProgress = async (courseId: string, progress: number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setUserData(prev => {
        if (!prev) return null;
        
        const updatedInscripciones = prev.InscripcionesCurso?.map(inscripcion => 
          inscripcion.cursoId === courseId 
            ? { 
                ...inscripcion, 
                updatedAt: new Date().toISOString(),
                // You could add custom progress field or use estado
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

  // Add activity
  const addActivity = async (activity: Omit<Activity, 'id' | 'date'>): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

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

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate reload from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const savedData = localStorage.getItem('priosync_user_data');
      if (savedData) {
        setUserData(JSON.parse(savedData));
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError('Error al actualizar datos');
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
    refreshUser
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
