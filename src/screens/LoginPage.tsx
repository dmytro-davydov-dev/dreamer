import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Button,
  Divider,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { signInWithEmail, signUpWithEmail, signInAsGuest } from "../app/config/firebase";

type Mode = "signin" | "signup";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "var(--color-text-primary, #e2e8f0)",
    "& fieldset": { borderColor: "rgba(0, 212, 255, 0.2)" },
    "&:hover fieldset": { borderColor: "rgba(0, 212, 255, 0.4)" },
    "&.Mui-focused fieldset": { borderColor: "var(--color-accent-primary, #00d4ff)" },
  },
  "& .MuiInputLabel-root": {
    color: "var(--color-text-secondary, #94a3b8)",
    "&.Mui-focused": { color: "var(--color-accent-primary, #00d4ff)" },
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clearError() {
    setError(null);
  }

  function friendlyError(code: string): string {
    switch (code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      case "auth/operation-not-allowed":
        return "Email/password sign-in is not enabled. Enable it in the Firebase console under Authentication → Sign-in methods.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
        navigate("/dashboard");
      } else {
        await signUpWithEmail(email, password);
        navigate("/about");
      }
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(friendlyError(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    clearError();
    setLoading(true);
    try {
      await signInAsGuest();
      navigate("/about");
    } catch {
      setError("Could not sign in as guest. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isSignIn = mode === "signin";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg-primary, #080c14)",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: "#0f1629",
          border: "1px solid rgba(0, 212, 255, 0.12)",
          borderRadius: "16px",
          p: { xs: 3, sm: 4 },
        }}
      >
        {/* Header */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            letterSpacing: "0.04em",
            background: "linear-gradient(135deg, #e2e8f0 30%, #00d4ff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            mb: 0.5,
          }}
        >
          Dreamer
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--color-text-secondary, #94a3b8)", mb: 3 }}>
          {isSignIn ? "Welcome back. Sign in to continue." : "Create an account to get started."}
        </Typography>

        {/* Mode toggle */}
        <Box sx={{ display: "flex", mb: 3, borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(0, 212, 255, 0.15)" }}>
          {(["signin", "signup"] as Mode[]).map((m) => (
            <Button
              key={m}
              fullWidth
              onClick={() => { setMode(m); clearError(); }}
              sx={{
                py: 1,
                borderRadius: 0,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                backgroundColor: mode === m ? "rgba(0, 212, 255, 0.12)" : "transparent",
                color: mode === m ? "var(--color-accent-primary, #00d4ff)" : "var(--color-text-secondary, #94a3b8)",
                "&:hover": { backgroundColor: "rgba(0, 212, 255, 0.08)" },
              }}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </Button>
          ))}
        </Box>

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ ...inputSx, mb: 2 }}
            size="small"
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ ...inputSx, mb: 2 }}
            size="small"
            autoComplete={isSignIn ? "current-password" : "new-password"}
          />

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#fca5a5",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                "& .MuiAlert-icon": { color: "#fca5a5" },
              }}
            >
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              background: "linear-gradient(135deg, #00d4ff 0%, #0099bb 100%)",
              color: "#080c14",
              fontWeight: 700,
              textTransform: "none",
              py: 1.25,
              borderRadius: "8px",
              mb: 2,
              "&:hover": { background: "linear-gradient(135deg, #33ddff 0%, #00bbdd 100%)" },
              "&:disabled": { opacity: 0.6 },
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "#080c14" }} />
            ) : isSignIn ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </Box>

        <Divider sx={{ borderColor: "rgba(0, 212, 255, 0.1)", mb: 2 }}>
          <Typography variant="caption" sx={{ color: "var(--color-text-secondary, #94a3b8)", px: 1 }}>
            or
          </Typography>
        </Divider>

        {/* Guest option */}
        <Button
          fullWidth
          variant="outlined"
          onClick={handleGuest}
          disabled={loading}
          sx={{
            borderColor: "rgba(0, 212, 255, 0.2)",
            color: "var(--color-text-secondary, #94a3b8)",
            textTransform: "none",
            fontWeight: 500,
            py: 1.25,
            borderRadius: "8px",
            "&:hover": {
              borderColor: "rgba(0, 212, 255, 0.4)",
              color: "var(--color-text-primary, #e2e8f0)",
              backgroundColor: "rgba(0, 212, 255, 0.04)",
            },
            "&:disabled": { opacity: 0.6 },
          }}
        >
          Continue as Guest
        </Button>
      </Box>
    </Box>
  );
}
