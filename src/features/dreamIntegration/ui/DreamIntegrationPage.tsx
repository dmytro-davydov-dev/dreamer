import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { NavLink } from "react-router";
import type { DreamId } from "../../../shared/types/domain";
import { analytics } from "../../../services/analytics";
import type { WordCountBucket } from "../../../services/analytics";

type DreamIntegrationPageProps = {
  dreamId?: DreamId;
};

function getWordCountBucket(text: string): WordCountBucket {
  const count = text.trim().split(/\s+/).filter(Boolean).length;
  if (count < 50) return "<50";
  if (count < 150) return "50-150";
  if (count < 500) return "150-500";
  return "500+";
}

export default function DreamIntegrationPage({ dreamId }: DreamIntegrationPageProps) {
  const { t } = useTranslation();
  const [journalText, setJournalText] = useState("");
  const integrationFiredRef = useRef(false);

  if (dreamId && !integrationFiredRef.current) {
    integrationFiredRef.current = true;
    analytics.capture("integration_triggered", {});
  }

  const handleJournalBlur = () => {
    if (journalText.trim().length > 0) {
      analytics.capture("journal_saved", { wordCountBucket: getWordCountBucket(journalText) });
    }
  };

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
              {t("integration.header")}
            </Typography>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: "var(--color-text-primary, #e2e8f0)",
                fontWeight: 700,
              }}
            >
              {t("integration.title")}
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
                  {t("integration.chooseDream")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "var(--color-text-muted, #64748b)" }}
                >
                  {t("integration.chooseDreamDescription")}
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    variant="outlined"
                    color="primary"
                    component={NavLink}
                    to="/"
                  >
                    {t("integration.viewDashboard")}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    component={NavLink}
                    to="/dreams/new"
                  >
                    {t("integration.recordDream")}
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
                    {t("integration.reflectiveSummary")}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: "var(--color-text-secondary, #94a3b8)" }}
                  >
                    {t("integration.reflectiveSummaryDescription")}
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
                    {t("integration.reflectiveQuestions")}
                  </Typography>
                  <Stack spacing={1.5}>
                    {([t("integration.question1"), t("integration.question2")] as const).map((question) => (
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
                    {t("integration.practiceSuggestion")}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: "var(--color-text-secondary, #94a3b8)" }}
                  >
                    {t("integration.practiceSuggestionDescription")}
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
                    {t("integration.journal")}
                  </Typography>
                  <TextField
                    label={t("integration.journalLabel")}
                    multiline
                    minRows={4}
                    placeholder={t("integration.journalPlaceholder")}
                    fullWidth
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                    onBlur={handleJournalBlur}
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
