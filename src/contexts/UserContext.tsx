'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipos de datos (preparados para DynamoDB)
export interface UserData {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  courses: CourseProgress[];
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

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

// Contexto
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

// Datos en duro (estructura compatible con DynamoDB)
const getDefaultUserData = (): UserData => ({
  userId: 'user_francisco_riquelme',
  name: 'Francisco Riquelme',
  email: 'francisco.riquelme@duocuc.cl',
  avatar: 'FR',
  courses: [
    {
      courseId: 'calculo-avanzado',
      courseName: 'Cálculo Avanzado',
      progress: 85,
      lastAccessed: '2025-09-11T09:30:00Z'
    },
    {
      courseId: 'desarrollo-software',
      courseName: 'Desarrollo de Software',
      progress: 65,
      lastAccessed: '2025-09-10T14:20:00Z'
    },
    {
      courseId: 'inteligencia-artificial',
      courseName: 'Inteligencia Artificial',
      progress: 78,
      lastAccessed: '2025-09-09T16:45:00Z'
    },
    {
      courseId: 'gestion-proyectos',
      courseName: 'Gestión de Proyectos',
      progress: 72,
      lastAccessed: '2025-09-08T11:15:00Z'
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
  ],
  createdAt: '2025-08-01T10:00:00Z',
  updatedAt: new Date().toISOString()
});

// Provider
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos al inicializar
  useEffect(() => {
    const loadUserData = () => {
      setLoading(true);
      try {
        const savedData = localStorage.getItem('priosync_user_data');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setUserData(parsedData);
        } else {
          // Primera vez - usar datos por defecto
          const defaultData = getDefaultUserData();
          setUserData(defaultData);
          localStorage.setItem('priosync_user_data', JSON.stringify(defaultData));
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Error al cargar datos del usuario');
        // Fallback a datos por defecto
        const defaultData = getDefaultUserData();
        setUserData(defaultData);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Guardar automáticamente cuando cambien los datos
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

  // Función para actualizar usuario
  const updateUser = async (updates: Partial<UserData>): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular delay de API
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

  // Función para actualizar progreso de curso
  const updateCourseProgress = async (courseId: string, progress: number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setUserData(prev => {
        if (!prev) return null;
        
        const updatedCourses = prev.courses.map(course => 
          course.courseId === courseId 
            ? { ...course, progress, lastAccessed: new Date().toISOString() }
            : course
        );
        
        return {
          ...prev,
          courses: updatedCourses,
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

  // Función para agregar actividad
  const addActivity = async (activity: Omit<Activity, 'id' | 'date'>): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      // Generar id y date solo en el cliente para evitar SSR mismatch
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
          activities: [newActivity, ...prev.activities],
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

  // Función para refrescar datos
  const refreshUser = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular recarga desde API
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

// Hook personalizado para usar el contexto
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
