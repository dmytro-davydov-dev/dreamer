import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./app/styles/base.css";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { initFirebase, ensureAnonymousAuth } from "./app/config/firebase";

import "./app/styles/tokens.css";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00d4ff",
      light: "#66e5ff",
      dark: "#0099bb",
      contrastText: "#080c14",
    },
    secondary: {
      main: "#7c3aed",
      light: "#a78bfa",
      dark: "#5b21b6",
      contrastText: "#ffffff",
    },
    background: {
      default: "#080c14",
      paper: "#0f1629",
    },
    text: {
      primary: "#e2e8f0",
      secondary: "#94a3b8",
      disabled: "#64748b",
    },
    success: {
      main: "#10b981",
    },
    warning: {
      main: "#f59e0b",
    },
    error: {
      main: "#ef4444",
    },
    divider: "rgba(0, 212, 255, 0.1)",
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.01em" },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 500 },
    body1: { lineHeight: 1.625 },
    body2: { lineHeight: 1.571 },
    overline: {
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: "0.7rem",
      letterSpacing: "0.12em",
      fontWeight: 500,
    },
    caption: {
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: "0.7rem",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 600,
          fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
          transition: "all 0.3s ease",
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #00d4ff, #0099bb)",
          color: "#080c14",
          boxShadow: "0 0 20px rgba(0, 212, 255, 0.2)",
          "&:hover": {
            background: "linear-gradient(135deg, #33ddff, #00c2d4)",
            boxShadow: "0 0 30px rgba(0, 212, 255, 0.4)",
          },
        },
        outlinedPrimary: {
          borderColor: "rgba(0, 212, 255, 0.4)",
          color: "#00d4ff",
          "&:hover": {
            borderColor: "rgba(0, 212, 255, 0.7)",
            backgroundColor: "rgba(0, 212, 255, 0.06)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          border: "1px solid rgba(0, 212, 255, 0.1)",
          backgroundImage: "none",
          backgroundColor: "rgba(15, 22, 41, 0.8)",
          backdropFilter: "blur(8px)",
          transition: "all 0.3s ease",
          "&:hover": {
            borderColor: "rgba(0, 212, 255, 0.25)",
            boxShadow: "0 8px 32px rgba(0, 212, 255, 0.08)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#0f1629",
        },
        outlined: {
          borderColor: "rgba(0, 212, 255, 0.12)",
          backgroundColor: "rgba(15, 22, 41, 0.8)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          fontWeight: 500,
          fontSize: "0.7rem",
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            backgroundColor: "rgba(15, 22, 41, 0.6)",
            "& fieldset": {
              borderColor: "rgba(0, 212, 255, 0.15)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(0, 212, 255, 0.35)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#00d4ff",
              boxShadow: "0 0 0 2px rgba(0, 212, 255, 0.12)",
            },
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#00d4ff",
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(0, 212, 255, 0.1)",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
        },
        standardWarning: {
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          color: "#f59e0b",
        },
        standardError: {
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#ef4444",
        },
        standardSuccess: {
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          color: "#10b981",
        },
        standardInfo: {
          backgroundColor: "rgba(0, 212, 255, 0.08)",
          border: "1px solid rgba(0, 212, 255, 0.2)",
          color: "#94a3b8",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          "&.active": {
            backgroundColor: "rgba(0, 212, 255, 0.08)",
            color: "#00d4ff",
          },
          "&:hover": {
            backgroundColor: "rgba(0, 212, 255, 0.06)",
          },
        },
      },
    },
  },
});

initFirebase();
ensureAnonymousAuth();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
