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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
                {t("byokGate.freeTrial")}
              </Typography>
              <Chip
                label={t("byokGate.dreamsLeft", { remaining, total: TRIAL_DREAM_LIMIT })}
                size="small"
                color="info"
                variant="outlined"
                sx={{ height: 18, fontSize: "0.7rem" }}
              />
            </Stack>
            <Typography variant="body2">
              {t("byokGate.usingSharedKey")}{" "}
              <Box
                component={NavLink}
                to="/settings"
                sx={{ color: "inherit", fontWeight: 600 }}
              >
                {t("byokGate.addOwnKey")}
              </Box>{" "}
              {t("byokGate.inSettingsForUnlimited")}
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
            {t("byokGate.trialUsedUp")}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {t("byokGate.trialExhausted", { total: TRIAL_DREAM_LIMIT })}
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
            {t("byokGate.goToSettings")}
          </Button>
          <Button
            variant="text"
            size="small"
            color="warning"
            onClick={handleRefresh}
          >
            {t("byokGate.addedMyKey")}
          </Button>
        </Stack>
      </Stack>
    </Alert>
  );
}
