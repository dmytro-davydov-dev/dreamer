/**
 * src/features/byok/ui/ByokGate.tsx
 *
 * Wraps any AI-dependent UI.
 * When no API key is set, renders a prompt to configure one.
 * When a key is present, renders children as-is.
 */

import { useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import KeyIcon from "@mui/icons-material/Key";
import { NavLink } from "react-router";

import { hasLlmApiKey } from "../service/keyStorage.service";

type ByokGateProps = {
  children: React.ReactNode;
};

export default function ByokGate({ children }: ByokGateProps) {
  // Re-check on every render — the user may have just set the key in another tab
  const [keyPresent, setKeyPresent] = useState(hasLlmApiKey);

  const handleRefresh = () => {
    setKeyPresent(hasLlmApiKey());
  };

  if (keyPresent) {
    return <>{children}</>;
  }

  return (
    <Alert
      severity="warning"
      icon={<KeyIcon fontSize="small" />}
      sx={{ alignItems: "flex-start" }}
    >
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="body2" fontWeight={600}>
            AI key required
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Dreamer uses a bring-your-own-key model. To use AI features, add your
            OpenAI-compatible API key in Settings.
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
