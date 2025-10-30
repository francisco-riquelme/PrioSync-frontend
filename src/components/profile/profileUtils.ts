import React from "react";
import {
  CheckCircle as CheckCircleIcon,
  Quiz as QuizIcon,
  Book as BookIcon,
  School as SchoolIcon,
} from "@mui/icons-material";

/**
 * Get user initials from name and surname
 */
export const getUserInitials = (
  nombre: string,
  apellido?: string | null
): string => {
  const firstInitial = nombre ? nombre.charAt(0).toUpperCase() : "";
  const lastInitial = apellido ? apellido.charAt(0).toUpperCase() : "";
  return firstInitial + lastInitial;
};

/**
 * Get full name from name and surname
 */
export const getFullName = (
  nombre: string,
  apellido?: string | null
): string => {
  return apellido ? `${nombre} ${apellido}` : nombre;
};

/**
 * Get activity icon based on activity type
 */
export const getActividadIcon = (tipo: string) => {
  switch (tipo) {
    case "leccion":
      return React.createElement(CheckCircleIcon, {
        sx: { color: "success.main", fontSize: 20 },
      });
    case "quiz":
      return React.createElement(QuizIcon, {
        sx: { color: "primary.main", fontSize: 20 },
      });
    case "sesion":
      return React.createElement(BookIcon, {
        sx: { color: "secondary.main", fontSize: 20 },
      });
    case "curso-completado":
      return React.createElement(SchoolIcon, {
        sx: { color: "warning.main", fontSize: 20 },
      });
    default:
      return React.createElement(CheckCircleIcon, {
        sx: { color: "text.secondary", fontSize: 20 },
      });
  }
};
