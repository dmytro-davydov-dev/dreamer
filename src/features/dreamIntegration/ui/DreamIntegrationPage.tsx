import { Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { NavLink } from "react-router";
import type { DreamId } from "../../../shared/types/domain";

type DreamIntegrationPageProps = {
  dreamId?: DreamId;
};

const DEFAULT_QUESTIONS = [
  "What feels most alive or unfinished about this dream right now?",
  "What small step could honor the feeling this dream leaves you with?",
];

export default function DreamIntegrationPage({ dreamId }: DreamIntegrationPageProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "var(--color-bg-primary, #080c14)",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography
              variant="overline"
              sx={{
                color: "var(--color-text-muted, #64748b)",
              }}
            >
              Dreamer
            </Typography>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: "var(--color-text-primary, #e2e8f0)",
                fontWeight: 700,
              }}
            >
              Integration
            </Typography>
          </Stack>

          {!dreamId ? (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderColor: "rgba(0, 212, 255, 0.12)",
                backgroundColor: "rgba(15, 22, 41, 0.8)",
              }}
            >
              <Stack spacing={2}>
                <Typography
                  variant="h6"
                  sx={{ color: "var(--color-text-primary, #e2e8f0)" }}
                >
                  Choose a dream to continue integration
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "var(--color-text-muted, #64748b)" }}
                >
                  Select a dream from your history or record a new one to begin
                  integration.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    variant="outlined"
                    color="primary"
                    component={NavLink}
                    to="/"
                  >
                    View Dashboard
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    component={NavLink}
                    to="/dreams/new"
                  >
                    Record a Dream
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ) : (
            <Stack spacing={3}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderColor: "var(--color-border-subtle, #E3E3DD)",
                  backgroundColor: "var(--color-bg-card, #FFFFFF)",
                }}
              >
                <Stack spacing={2}>
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{ color: "var(--color-text-primary, #e2e8f0)" }}
                  >
                    Reflective Summary
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: "var(--color-text-secondary, #94a3b8)" }}
                  >
                    This is a gentle summary of what has surfaced so far. Let it
                    be a starting point rather than a conclusion.
                  </Typography>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderColor: "var(--color-border-subtle, #E3E3DD)",
                  backgroundColor: "var(--color-bg-card, #FFFFFF)",
                }}
              >
                <Stack spacing={2}>
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{ color: "var(--color-text-primary, #e2e8f0)" }}
                  >
                    Reflective Questions
                  </Typography>
                  <Stack spacing={1.5}>
                    {DEFAULT_QUESTIONS.map((question) => (
                      <Typography
                        key={question}
                        variant="body1"
                        sx={{ color: "var(--color-text-secondary, #94a3b8)" }}
                      >
                        {question}
                      </Typography>
                    ))}
                  </Stack>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderColor: "var(--color-border-subtle, #E3E3DD)",
                  backgroundColor: "var(--color-bg-card, #FFFFFF)",
                }}
              >
                <Stack spacing={2}>
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{ color: "var(--color-text-primary, #e2e8f0)" }}
                  >
                    Practice Suggestion
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: "var(--color-text-secondary, #94a3b8)" }}
                  >
                    Try a small, grounding action that echoes the dream's feeling
                    or image. Keep it gentle and optional.
                  </Typography>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderColor: "var(--color-border-subtle, #E3E3DD)",
                  backgroundColor: "var(--color-bg-card, #FFFFFF)",
                }}
              >
                <Stack spacing={2}>
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{ color: "var(--color-text-primary, #e2e8f0)" }}
                  >
                    Journal
                  </Typography>
                  <TextField
                    label="Journal (optional)"
                    multiline
                    minRows={4}
                    placeholder="Write anything that feels worth keeping."
                    fullWidth
                  />
                </Stack>
              </Paper>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
