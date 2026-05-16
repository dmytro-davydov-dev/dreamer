/**
 * src/features/dreamInterpretation/ui/InterpretationPage.tsx
 *
 * DRM-13: Interpretation -- generate and review hypotheses.
 */

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type { Firestore } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import {
  getDream,
  listElements,
  listAssociations,
  listHypotheses,
  setHypothesisFeedback,
} from "../../../services/firestore/firestoreRepo";
import { getEffectiveLlmApiKey } from "../../../features/byok/service/keyStorage.service";
import ByokGate from "../../../features/byok/ui/ByokGate";
import { HypothesisCard } from "../../../entities/hypothesis/ui";
import { generateHypotheses } from "../service/generateHypotheses.service";
import { LlmError } from "../../../services/ai/client/llmClient";
import { analytics } from "../../../services/analytics";
import type {
  AssociationDoc,
  AssociationId,
  DreamDoc,
  DreamElementDoc,
  DreamId,
  ElementId,
  HypothesisDoc,
  HypothesisId,
  HypothesisFeedback,
  UID,
} from "../../../shared/types/domain";

type PageStatus = "loading" | "ready" | "generating" | "error";

interface InterpretationPageProps {
  db: Firestore;
  uid: UID;
  dreamId: DreamId;
  onContinue?: (dreamId: DreamId) => void;
}

export default function InterpretationPage({
  db,
  uid,
  dreamId,
  onContinue,
}: InterpretationPageProps) {
  const { t, i18n } = useTranslation();
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [dream, setDream] = useState<DreamDoc | null>(null);
  const [elements, setElements] = useState<Array<{ id: ElementId; data: DreamElementDoc }>>([]);
  const [associations, setAssociations] = useState<Array<{ id: AssociationId; data: AssociationDoc }>>([]);
  const [hypotheses, setHypotheses] = useState<Array<{ id: HypothesisId; data: HypothesisDoc }>>([]);
  const [error, setError] = useState<string>("");
  const [generateError, setGenerateError] = useState<string>("");
  const [savingFeedbackId, setSavingFeedbackId] = useState<HypothesisId | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [dreamDoc, els, assocs, hyps] = await Promise.all([
          getDream(db, uid, dreamId),
          listElements(db, uid, dreamId),
          listAssociations(db, uid, dreamId),
          listHypotheses(db, uid, dreamId),
        ]);

        if (!dreamDoc) {
          setError(t("interpretation.errors.dreamNotFound"));
          setPageStatus("error");
          return;
        }

        setDream(dreamDoc);
        setElements(els);
        setAssociations(assocs);
        setHypotheses(hyps);
        setPageStatus("ready");
      } catch (err) {
        console.error("Failed to load interpretation page:", err);
        setError(t("interpretation.errors.loadDreamFailed"));
        setPageStatus("error");
      }
    };

    load();
  }, [db, uid, dreamId]);

  const handleGenerate = useCallback(async () => {
    if (!dream) return;

    const apiKey = getEffectiveLlmApiKey();
    if (!apiKey) {
      setGenerateError(t("interpretation.errors.noApiKey"));
      return;
    }

    setPageStatus("generating");
    setGenerateError("");
    analytics.capture("interpretation_triggered", {
      associationCount: associations.length,
      elementCount: elements.length,
    });

    try {
      const result = await generateHypotheses({
        db,
        uid,
        dreamId,
        dream,
        elements,
        associations,
        apiKey,
        language: i18n.language,
      });

      setHypotheses(result.hypotheses);
      setPageStatus("ready");
    } catch (err) {
      console.error("Failed to generate hypotheses:", err);

      if (err instanceof LlmError) {
        setGenerateError(t("interpretation.errors.apiError", { message: err.message }));
      } else {
        setGenerateError(t("interpretation.errors.generateFailed"));
      }

      setPageStatus("ready");
    }
  }, [db, uid, dreamId, dream, elements, associations]);

  const handleFeedback = useCallback(
    async (hypothesisId: HypothesisId, feedback: HypothesisFeedback) => {
      try {
        setError("");
        setSavingFeedbackId(hypothesisId);
        await setHypothesisFeedback(db, uid, dreamId, hypothesisId, feedback);

        const hypothesisIndex = hypotheses.findIndex((h) => h.id === hypothesisId);
        const hypothesis = hypotheses.find((h) => h.id === hypothesisId);
        if (hypothesis) {
          analytics.capture("hypothesis_feedback_given", {
            lens: hypothesis.data.lens,
            feedback,
            hypothesisIndex: Math.max(0, hypothesisIndex),
          });
        }

        setHypotheses((prev) =>
          prev.map((h) =>
            h.id === hypothesisId
              ? { ...h, data: { ...h.data, userFeedback: feedback } }
              : h
          )
        );
      } catch (err) {
        console.error("Failed to set feedback:", err);
        setError(t("interpretation.errors.feedbackFailed"));
      } finally {
        setSavingFeedbackId(null);
      }
    },
    [db, uid, dreamId, hypotheses]
  );

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
              sx={{ color: "var(--color-text-muted, #64748b)" }}
            >
              {t("interpretation.step")}
            </Typography>
            <Typography
              variant="h4"
              component="h1"
              sx={{ color: "var(--color-text-primary, #e2e8f0)", fontWeight: 700 }}
            >
              {t("interpretation.title")}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "var(--color-text-secondary, #94a3b8)", maxWidth: 560 }}
            >
              {t("interpretation.subtitle")}
            </Typography>
          </Stack>

          {pageStatus === "loading" && (
            <Stack spacing={2}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rounded" height={300} />
              ))}
            </Stack>
          )}

          {pageStatus === "error" && (
            <Alert severity="error">
              {error || t("interpretation.errors.loadFailed")}
            </Alert>
          )}

          {pageStatus !== "loading" && pageStatus !== "error" && (
            <>
              {hypotheses.length === 0 && (
                <Box>
                  <Stack spacing={2.5}>
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{ color: "var(--color-text-primary, #e2e8f0)" }}
                    >
                      {t("interpretation.generateTitle")}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "var(--color-text-secondary, #94a3b8)" }}
                    >
                      {t("interpretation.generateDescription")}
                    </Typography>

                    {getEffectiveLlmApiKey() ? (
                      <Stack spacing={1.5}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={
                            pageStatus === "generating" ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <AutoAwesomeIcon fontSize="small" />
                            )
                          }
                          onClick={handleGenerate}
                          disabled={pageStatus === "generating"}
                          sx={{ alignSelf: "flex-start" }}
                        >
                          {pageStatus === "generating"
                            ? t("interpretation.generating")
                            : t("interpretation.generateButton")}
                        </Button>
                        {generateError && (
                          <Alert severity="error">{generateError}</Alert>
                        )}
                      </Stack>
                    ) : (
                      <ByokGate>{null}</ByokGate>
                    )}
                  </Stack>
                </Box>
              )}

              {hypotheses.length > 0 && (
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      variant="body2"
                      sx={{ color: "var(--color-text-muted, #64748b)" }}
                    >
                      {t("interpretation.hypothesesCount", { count: hypotheses.length })}
                    </Typography>
                    {getEffectiveLlmApiKey() && (
                      <Button
                        variant="text"
                        size="small"
                        startIcon={
                          pageStatus === "generating" ? (
                            <CircularProgress size={12} color="inherit" />
                          ) : (
                            <AutoAwesomeIcon fontSize="small" />
                          )
                        }
                        onClick={handleGenerate}
                        disabled={pageStatus === "generating"}
                        sx={{
                          color: "var(--color-text-muted, #64748b)",
                          textTransform: "none",
                          fontSize: "12px",
                        }}
                      >
                        {t("interpretation.reGenerate")}
                      </Button>
                    )}
                    {generateError && (
                      <Alert severity="error" sx={{ py: 0, flex: 1 }}>
                        {generateError}
                      </Alert>
                    )}
                  </Stack>

                  {hypotheses.map((hyp) => (
                    <HypothesisCard
                      key={hyp.id}
                      hypothesis={hyp}
                      elements={elements}
                      associations={associations}
                      isSavingFeedback={savingFeedbackId === hyp.id}
                      onFeedback={(id, feedback) => handleFeedback(id, feedback)}
                    />
                  ))}

                  {error && (
                    <Alert severity="warning">{error}</Alert>
                  )}
                </Stack>
              )}

              {hypotheses.length > 0 && (
                <>
                  <Divider sx={{ borderColor: "rgba(0, 212, 255, 0.12)" }} />
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "var(--color-text-muted, #64748b)" }}
                    >
                      {t("interpretation.continueHint")}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => onContinue?.(dreamId)}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      {t("interpretation.continueButton")}
                    </Button>
                  </Stack>
                </>
              )}
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
