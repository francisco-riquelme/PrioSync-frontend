import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0891b2",        // Cian oscuro
      light: "#06b6d4",       // Cian
      dark: "#0e7490",        // Cian muy oscuro
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#14b8a6",        // Teal
      light: "#2dd4bf",       // Teal claro
      dark: "#0d9488",        // Teal oscuro
      contrastText: "#ffffff",
    },
    background: {
      default: "#f0fdfa",     // Teal muy muy claro
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",     // Azul oscuro casi negro
      secondary: "#475569",   // Gris pizarra
    },
    success: {
      main: "#22c55e",        // Verde
      light: "#4ade80",
      dark: "#16a34a",
    },
    warning: {
      main: "#f97316",        // Naranja
      light: "#fb923c",
      dark: "#ea580c",
    },
    error: {
      main: "#dc2626",        // Rojo
      light: "#ef4444",
      dark: "#b91c1c",
    },
    info: {
      main: "#0891b2",        // Igual que primary
      light: "#06b6d4",
      dark: "#0e7490",
    },
  },
  typography: {
    fontFamily: "Inter, Roboto, Arial, sans-serif",
    h4: {
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 16,
  },
});

export default theme;