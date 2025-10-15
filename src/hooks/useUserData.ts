"use client";

import { UserData, useUser } from "@/contexts/UserContext";
import { useState, useCallback, useMemo } from "react";
import { signIn, signOut, getCurrentUser } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { getQueryFactories } from "@/utils/commons/queries";
import type { MainTypes } from "@/utils/api/schema";
// Hook para autenticación con AWS Amplify
export const useAuth = () => {
  const { userData, loading, refreshUser } = useUser();
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();

  const login = useCallback(
    async (email: string, password: string) => {
      setAuthLoading(true);
      try {
        // Use AWS Amplify signIn
        const { isSignedIn, nextStep } = await signIn({
          username: email,
          password: password,
        });

        if (isSignedIn) {
          // Login successful, update last login timestamp
          try {
            const { Usuario } = await getQueryFactories<
              Pick<MainTypes, "Usuario">,
              "Usuario"
            >({
              entities: ["Usuario"],
            });
            const currentUser = await getCurrentUser();
            if (currentUser?.userId) {
              await Usuario.update({
                input: {
                  usuarioId: currentUser.userId,
                  ultimo_login: new Date().toISOString(),
                },
              });
            }
          } catch (updateError) {
            console.error("Failed to update last login:", updateError);
            // Don't block login flow if update fails
          }

          // Refresh user data
          await refreshUser();
          return { success: true };
        } else if (nextStep?.signInStep === "CONFIRM_SIGN_UP") {
          // User needs to confirm email
          return {
            success: false,
            error: "Por favor verifica tu email antes de iniciar sesión",
          };
        } else {
          return { success: false, error: "Credenciales inválidas" };
        }
      } catch (error) {
        console.error("Login error:", error);
        let errorMessage = "Credenciales inválidas";

        if (error instanceof Error) {
          if (error.message.includes("UserNotFoundException")) {
            errorMessage = "Usuario no encontrado";
          } else if (error.message.includes("NotAuthorizedException")) {
            errorMessage = "Contraseña incorrecta";
          } else if (error.message.includes("UserNotConfirmedException")) {
            errorMessage =
              "Por favor verifica tu email antes de iniciar sesión";
          }
        }

        return { success: false, error: errorMessage };
      } finally {
        setAuthLoading(false);
      }
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    setAuthLoading(true);
    try {
      // Use AWS Amplify signOut
      await signOut();

      // Clear any cached data
      if (typeof window !== "undefined") {
        localStorage.removeItem("priosync_user_data");
      }

      // Redirect to login page
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

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
  const { userData, updateCourseProgress } = useUser();

  const updateProgress = useCallback(
    async (courseId: string, newProgress: number) => {
      try {
        await updateCourseProgress(courseId, newProgress);

        // Agregar actividad automáticamente si completa el curso
        if (newProgress >= 100) {
          const course = userData?.InscripcionesCurso?.find(
            (c) => c.cursoId === courseId
          );
          if (course) {
            // await addActivity({
            //   title: `Completado: ${course.titulo}`,
            //   subtitle: "Curso Completo - Felicitaciones",
            //   type: "course_completed",
            // });
          }
        }

        return { success: true };
      } catch (error) {
        console.error("Error updating course progress:", error);
        return { success: false, error: "Error al actualizar progreso" };
      }
    },
    [userData, updateCourseProgress]
  );

  const courses = userData?.InscripcionesCurso || [];

  // Calculate progress based on estado field
  // completado = 100%, en_progreso = 50%, inscrito = 0%, abandonado = 0%
  const totalProgress =
    courses.length > 0
      ? Math.round(
          courses.reduce((sum: number, course) => {
            const progress =
              course.estado === "completado"
                ? 100
                : course.estado === "en_progreso"
                  ? 50
                  : 0;
            return sum + progress;
          }, 0) / courses.length
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
    async (updates: Partial<UserData>) => {
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

  const userName = userData?.nombre
    ? `${userData.nombre}${userData.apellido ? " " + userData.apellido : ""}`
    : "";

  const dashboardData = {
    user: {
      nombre: userName,
      greeting: `¡Hola, ${userData?.nombre || "Usuario"}!`,
    },
    courses: {
      list: courses,
      totalProgress,
      inProgress: courses.filter((c) => c.estado === "en_progreso").length,
      completed: courses.filter((c) => c.estado === "completado").length,
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
