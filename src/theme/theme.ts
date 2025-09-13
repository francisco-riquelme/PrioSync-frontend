import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3b82f6",
    },
    secondary: {
      main: "#f5f9fe",
    },
    background: {
      default: "#e3edfa",
      paper: "#fff",
    },
    text: {
      primary: "#222",
      secondary: "#6b7280",
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