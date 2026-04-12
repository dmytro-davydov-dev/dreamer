import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import KeyIcon from "@mui/icons-material/Key";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import {
  clearLlmApiKey,
  getLlmApiKey,
  hasLlmApiKey,
  setLlmApiKey,
} from "../service/keyStorage.service";

export default function SettingsPage() {
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [keyIsSet, setKeyIsSet] = useState(hasLlmApiKey);

  const handleSave = () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    setLlmApiKey(trimmed);
    setKeyInput("");
    setKeyIsSet(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = () => {
    clearLlmApiKey();
    setKeyInput("");
    setKeyIsSet(false);
    setSaved(false);
  };

  const maskedKey = (() => {
    const k = getLlmApiKey();
    if (!k) return null;
    return k.slice(0, 7) + "•".repeat(Math.max(0, k.length - 11)) + k.slice(-4);
  })();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "var(--color-bg-primary, #080c14)",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={4}>
          {/* Header */}
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ color: "var(--color-text-muted, #64748b)" }}>
              Dreamer
            </Typography>
            <Typography
              variant="h4"
              component="h1"
              sx={{ color: "var(--color-text-primary, #e2e8f0)", fontWeight: 700 }}
            >
              Settings
            </Typography>
          </Stack>

          {/* API Key section */}
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderColor: "rgba(0, 212, 255, 0.12)",
              backgroundColor: "rgba(15, 22, 41, 0.8)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <KeyIcon sx={{ color: "#00d4ff", fontSize: 20 }} />
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{ color: "var(--color-text-primary, #e2e8f0)" }}
                  >
                    AI API Key
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: "var(--color-text-secondary, #94a3b8)" }}>
                  Dreamer uses a Bring-Your-Own-Key model. Your key is stored only in
                  this browser and is never sent to our servers.
                </Typography>
              </Stack>

              <Divider />

              {/* Current key status */}
              {keyIsSet && maskedKey ? (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlineIcon sx={{ color: "#10b981", fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: "var(--color-text-secondary, #94a3b8)" }}>
                      Key saved:{" "}
                      <Box
                        component="span"
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          color: "#00d4ff",
                          fontSize: "0.8rem",
                        }}
                      >
                        {maskedKey}
                      </Box>
                    </Typography>
                  </Stack>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleClear}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Remove key
                  </Button>
                </Stack>
              ) : null}

              {/* Key input */}
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ color: "var(--color-text-secondary, #94a3b8)" }}>
                  {keyIsSet ? "Replace with a new key:" : "Enter your OpenAI-compatible API key:"}
                </Typography>
                <TextField
                  label="API key"
                  placeholder="sk-..."
                  type={showKey ? "text" : "password"}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  size="small"
                  fullWidth
                  autoComplete="off"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showKey ? "Hide key" : "Show key"}
                          onClick={() => setShowKey((v) => !v)}
                          edge="end"
                          size="small"
                        >
                          {showKey ? (
                            <VisibilityOffIcon fontSize="small" />
                          ) : (
                            <VisibilityIcon fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={!keyInput.trim()}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Save key
                </Button>
                {saved && (
                  <Alert severity="success" sx={{ py: 0.5 }}>
                    Key saved locally.
                  </Alert>
                )}
              </Stack>

              <Divider />

              {/* Privacy note */}
              <Alert severity="info" icon={false} sx={{ py: 1 }}>
                <Typography variant="body2">
                  <strong>Privacy note:</strong> Your API key and dream content remain
                  in your browser and your Firestore database. Dreamer never logs dream
                  text or shares it with third parties beyond the AI provider you
                  configure here.
                </Typography>
              </Alert>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
