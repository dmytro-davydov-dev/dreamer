/**
 * src/features/byok/ui/ByokGate.tsx
 *
 * Wraps AI-dependent UI.
 *
 * Behaviour:
 *  - User has their own key → render children, no banner.
 *  - No user key + trial dreams remaining → render children + info banner
 *    showing how many free dreams are left.
 *  - No user key + trial exhausted → render upgrade prompt (hard gate).
 */

import { useState } from "react";
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import KeyIcon from "@mui/icons-material/Key";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { NavLink } from "react-router";

import {
  hasLlmApiKey,
  hasTrialDreamsRemaining,
  getTrialDreamsUsed,
  TRIAL_DREAM_LIMIT,
} from "../service/keyStorage.service";

type ByokGateProps = {
  children: React.ReactNode;
};

export default function ByokGate({ children }: ByokGateProps) {
  const [ownKey, setOwnKey] = useState(hasLlmApiKey);
  const [trialRemaining, setTrialRemaining] = useState(hasTrialDreamsRemaining);

  const handleRefresh = () => {
    setOwnKey(hasLlmApiKey());
    setTrialRemaining(hasTrialDreamsRemaining());
  };

  // ── User has their own key ────────────────────────────────────────────────
  if (ownKey) {
    return <>{children}</>;
  }

  // ── Trial dreams still available ──────────────────────────────────────────
  if (trialRemaining) {
    const used = getTrialDreamsUsed();
    const remaining = TRIAL_DREAM_LIMIT - used;

    return (
      <Stack spacing={2}>
        <Alert
          severity="info"
          icon={<AutoAwesomeIcon fontSize="small" />}
          sx={{ alignItems: "flex-start" }}
        >
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight={600}>
                Free trial
              </Typography>
              <Chip
                label={`${remaining} of ${TRIAL_DREAM_LIMIT} dreams left`}
                size="small"
                color="info"
                variant="outlined"
                sx={{ height: 18, fontSize: "0.7rem" }}
              />
            </Stack>
            <Typography variant="body2">
              You're using a shared key.{" "}
              <Box
                component={NavLink}
                to="/settings"
                sx={{ color: "inherit", fontWeight: 600 }}
              >
                Add your own API key
              </Box>{" "}
              in Settings for unlimited access.
            </Typography>
          </Stack>
        </Alert>
        {children}
      </Stack>
    );
  }

  // ── Trial exhausted, no user key ─────────────────────────────────────────
  return (
    <Alert
      severity="warning"
      icon={<KeyIcon fontSize="small" />}
      sx={{ alignItems: "flex-start" }}
    >
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="body2" fontWeight={600}>
            Free trial used up
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            You've used all {TRIAL_DREAM_LIMIT} free trial dreams. Add your own
            OpenAI-compatible API key in Settings to continue.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            component={NavLink}
            to="/settings"
            variant="outlined"
            size="small"
            color="warning"
          >
            Go to Settings
          </Button>
          <Button
            variant="text"
            size="small"
            color="warning"
            onClick={handleRefresh}
          >
            I've added my key
          </Button>
        </Stack>
      </Stack>
    </Alert>
  );
}
