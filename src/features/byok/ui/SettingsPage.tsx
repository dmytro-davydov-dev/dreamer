import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import i18n, { SUPPORTED_LANGUAGES } from "../../../app/i18n";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import KeyIcon from "@mui/icons-material/Key";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

import {
  clearLlmApiKey,
  getLlmApiKey,
  hasLlmApiKey,
  setLlmApiKey,
  getTrialDreamsUsed,
  TRIAL_DREAM_LIMIT,
  hasTrialDreamsRemaining,
} from "../service/keyStorage.service";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [keyIsSet, setKeyIsSet] = useState(hasLlmApiKey);
  const [trialUsed, setTrialUsed] = useState(getTrialDreamsUsed);

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
    setTrialUsed(getTrialDreamsUsed());
    setSaved(false);
  };

  const maskedKey = (() => {
    const k = getLlmApiKey();
    if (!k) return null;
    return k.slice(0, 7) + "•".repeat(Math.max(0, k.length - 11)) + k.slice(-4);
  })();

  const trialRemaining = hasTrialDreamsRemaining();
  const trialProgress = Math.min((trialUsed / TRIAL_DREAM_LIMIT) * 100, 100);

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
              {t("settings.header")}
            </Typography>
            <Typography
              variant="h4"
              component="h1"
              sx={{ color: "var(--color-text-primary, #e2e8f0)", fontWeight: 700 }}
            >
              {t("settings.title")}
            </Typography>
          </Stack>

          {/* Language selector */}
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderColor: "rgba(0, 212, 255, 0.12)",
              backgroundColor: "rgba(15, 22, 41, 0.8)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Stack spacing={2}>
              <Typography variant="h6" component="h2" sx={{ color: "var(--color-text-primary, #e2e8f0)" }}>
                {t("settings.language")}
              </Typography>
              <Select
                size="small"
                value={i18n.language.split("-")[0]}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                sx={{
                  color: "var(--color-text-primary, #e2e8f0)",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0, 212, 255, 0.2)" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0, 212, 255, 0.4)" },
                  "& .MuiSvgIcon-root": { color: "var(--color-text-secondary, #94a3b8)" },
                  maxWidth: 240,
                }}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>{lang.label}</MenuItem>
                ))}
              </Select>
            </Stack>
          </Paper>

          {/* Trial status — shown only when not using own key */}
          {!keyIsSet && (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderColor: trialRemaining
                  ? "rgba(0, 212, 255, 0.2)"
                  : "rgba(245, 158, 11, 0.3)",
                backgroundColor: "rgba(15, 22, 41, 0.8)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AutoAwesomeIcon
                    sx={{
                      color: trialRemaining ? "#00d4ff" : "#f59e0b",
                      fontSize: 20,
                    }}
                  />
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{ color: "var(--color-text-primary, #e2e8f0)" }}
                  >
                    {t("settings.freeTrial.title")}
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography
                      variant="body2"
                      sx={{ color: "var(--color-text-secondary, #94a3b8)" }}
                    >
                      {t("settings.freeTrial.dreamsRecorded")}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: trialRemaining ? "#00d4ff" : "#f59e0b",
                        fontWeight: 600,
                      }}
                    >
                      {trialUsed} / {TRIAL_DREAM_LIMIT}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={trialProgress}
                    color={trialRemaining ? "info" : "warning"}
                    sx={{ borderRadius: 1, height: 6 }}
                  />
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ color: "var(--color-text-secondary, #94a3b8)" }}
                >
                  {trialRemaining
                    ? t("settings.freeTrial.dreamsRemaining", { count: TRIAL_DREAM_LIMIT - trialUsed })
                    : t("settings.freeTrial.trialEnded")}
                </Typography>
              </Stack>
            </Paper>
          )}

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
                    {t("settings.apiKey.title")}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: "var(--color-text-secondary, #94a3b8)" }}>
                  {t("settings.apiKey.description")}
                </Typography>
              </Stack>

              <Divider />

              {/* Current key status */}
              {keyIsSet && maskedKey ? (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlineIcon sx={{ color: "#10b981", fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: "var(--color-text-secondary, #94a3b8)" }}>
                      {t("settings.apiKey.keySaved")}{" "}
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
                    {t("settings.apiKey.removeKey")}
                  </Button>
                </Stack>
              ) : null}

              {/* Key input */}
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ color: "var(--color-text-secondary, #94a3b8)" }}>
                  {keyIsSet ? t("settings.apiKey.replaceKey") : t("settings.apiKey.enterKey")}
                </Typography>
                <TextField
                  label={t("settings.apiKey.label")}
                  placeholder={t("settings.apiKey.placeholder")}
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
                          aria-label={showKey ? t("settings.apiKey.hideKey") : t("settings.apiKey.showKey")}
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
                  {t("settings.apiKey.saveKey")}
                </Button>
                {saved && (
                  <Alert severity="success" sx={{ py: 0.5 }}>
                    {t("settings.apiKey.savedLocally")}
                  </Alert>
                )}
              </Stack>

              <Divider />

              {/* Privacy note */}
              <Alert severity="info" icon={false} sx={{ py: 1 }}>
                <Typography variant="body2">
                  <strong>{t("settings.privacyNote.title")}</strong>{" "}
                  {t("settings.privacyNote.body")}
                </Typography>
              </Alert>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
