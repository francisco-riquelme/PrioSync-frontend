"use client";

import { useUser } from "@/contexts/UserContext";
import { useState, useCallback, useMemo } from "react";

// Hook para autenticación (preparado para AWS Cognito)
export const useAuth = () => {
  const { userData, loading } = useUser();
  const [authLoading, setAuthLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = useCallback(async (email: string, _password: string) => {
    setAuthLoading(true);
    try {
      // Ahora: simulación
      // Después: AWS Cognito authentication
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simular login exitoso
      console.log("Login successful for:", email);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Credenciales inválidas" };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthLoading(true);
    try {
      // Ahora: limpiar localStorage
      localStorage.removeItem("priosync_user_data");

      // Después: AWS Cognito signOut
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const isAuthenticated = !!userData;

  return {
    user: userData,
    isAuthenticated,
    loading: loading || authLoading,
    login,
    logout,
  };
};

// Hook para manejo de cursos
export const useCourses = () => {
  const { userData, updateCourseProgress, addActivity } = useUser();

  const updateProgress = useCallback(
    async (courseId: string, newProgress: number) => {
      try {
        await updateCourseProgress(courseId, newProgress);

        // Agregar actividad automáticamente si completa el curso
        if (newProgress >= 100) {
          const course = userData?.courses.find((c) => c.courseId === courseId);
          if (course) {
            await addActivity({
              title: `Completado: ${course.courseName}`,
              subtitle: "Curso Completo - Felicitaciones",
              type: "course_completed",
            });
          }
        }

        return { success: true };
      } catch (error) {
        console.error("Error updating course progress:", error);
        return { success: false, error: "Error al actualizar progreso" };
      }
    },
    [userData, updateCourseProgress, addActivity]
  );

  const courses = userData?.courses || [];
  const totalProgress =
    courses.length > 0
      ? Math.round(
          courses.reduce((sum, course) => sum + course.progress, 0) /
            courses.length
        )
      : 0;

  return {
    courses,
    totalProgress,
    updateProgress,
  };
};

// Hook para manejo de actividades
export const useActivities = () => {
  const { userData, addActivity } = useUser();

  const activities = useMemo(
    () => userData?.activities || [],
    [userData?.activities]
  );

  const addNewActivity = useCallback(
    async (
      title: string,
      subtitle: string,
      type:
        | "course_completed"
        | "module_completed"
        | "evaluation_completed"
        | "assignment_completed"
    ) => {
      try {
        await addActivity({ title, subtitle, type });
        return { success: true };
      } catch (error) {
        console.error("Error adding activity:", error);
        return { success: false, error: "Error al agregar actividad" };
      }
    },
    [addActivity]
  );

  // Filtrar actividades por tipo
  const getActivitiesByType = useCallback(
    (type: string) => {
      if (type === "all") return activities;
      return activities.filter((activity) => activity.type === type);
    },
    [activities]
  );

  // Estadísticas de actividades
  const stats = {
    total: activities.length,
    coursesCompleted: activities.filter((a) => a.type === "course_completed")
      .length,
    modulesCompleted: activities.filter((a) => a.type === "module_completed")
      .length,
    evaluationsCompleted: activities.filter(
      (a) => a.type === "evaluation_completed"
    ).length,
  };

  return {
    activities,
    addNewActivity,
    getActivitiesByType,
    stats,
  };
};

// Hook para perfil de usuario
export const useProfile = () => {
  const { userData, updateUser, loading, error } = useUser();
  const [profileLoading, setProfileLoading] = useState(false);

  const updateProfile = useCallback(
    async (updates: { name?: string; email?: string; avatar?: string }) => {
      setProfileLoading(true);
      try {
        await updateUser(updates);
        return { success: true, message: "Perfil actualizado correctamente" };
      } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Error al actualizar perfil" };
      } finally {
        setProfileLoading(false);
      }
    },
    [updateUser]
  );

  const changePassword = useCallback(async () => {
    setProfileLoading(true);
    try {
      // Ahora: simulación
      // Después: AWS Cognito changePassword
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Password changed successfully");
      return { success: true, message: "Contraseña actualizada correctamente" };
    } catch (error) {
      console.error("Error changing password:", error);
      return { success: false, error: "Error al cambiar contraseña" };
    } finally {
      setProfileLoading(false);
    }
  }, []);

  return {
    profile: userData,
    loading: loading || profileLoading,
    error,
    updateProfile,
    changePassword,
  };
};

// Hook para datos del dashboard
export const useDashboard = () => {
  const { userData } = useUser();
  const { courses, totalProgress } = useCourses();
  const { activities, stats } = useActivities();

  // Generar consejo de IA (simulado)
  const generateAIAdvice = useCallback(async () => {
    const advices = [
      "Evalúa tu conocimiento activamente sin consultar tus apuntes para identificar lagunas y reforzar el aprendizaje.",
      "Dedica 25 minutos de estudio concentrado seguidos de 5 minutos de descanso (Técnica Pomodoro).",
      "Enseña lo que has aprendido a alguien más. Es una excelente forma de consolidar conocimientos.",
      "Revisa tus notas al final del día para reforzar la memoria a largo plazo.",
      "Establece metas de estudio pequeñas y alcanzables para mantener la motivación alta.",
    ];

    // Simular procesamiento de IA
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Usar Math.random solo en el cliente
    let randomAdvice = advices[0];
    if (typeof window !== "undefined") {
      randomAdvice = advices[Math.floor(Math.random() * advices.length)];
    }
    return randomAdvice;
  }, []);

  const dashboardData = {
    user: {
      name: userData?.name || "",
      greeting: `¡Hola, ${userData?.name?.split(" ")[0] || "Usuario"}!`,
    },
    courses: {
      list: courses,
      totalProgress,
      inProgress: courses.filter((c) => c.progress > 0 && c.progress < 100)
        .length,
      completed: courses.filter((c) => c.progress >= 100).length,
    },
    activities: {
      recent: activities.slice(0, 5),
      stats,
    },
  };

  return {
    dashboardData,
    generateAIAdvice,
  };
};
