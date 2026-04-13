/**
 * src/entities/hypothesis/ui/HypothesisCard.tsx
 *
 * Molecule card for displaying one hypothesis with resonance/fit feedback.
 */

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { useState } from "react";

import type {
  HypothesisDoc,
  HypothesisFeedback,
  HypothesisId,
  JungianLens,
} from "../../../shared/types/domain";

interface HypothesisCardProps {
  hypothesis: { id: HypothesisId; data: HypothesisDoc };
  onFeedback?: (id: HypothesisId, feedback: HypothesisFeedback) => void;
  isSavingFeedback?: boolean;
}

const LENS_LABELS: Record<JungianLens, string> = {
  compensation: "Compensation",
  shadow: "Shadow",
  archetypal_dynamics: "Archetypal Dynamics",
  relational_anima_animus: "Anima / Animus",
  individuation: "Individuation",
};

export default function HypothesisCard({
  hypothesis,
  onFeedback,
  isSavingFeedback = false,
}: HypothesisCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { id, data } = hypothesis;
  const isResonates = data.userFeedback === "resonates";
  const isDoesNotFit = data.userFeedback === "does_not_fit";

  const evidenceTypeLabel: Record<string, string> = {
    dream_text: "Dream Text",
    element: "Element",
    association: "Association",
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, nextExpanded) => setExpanded(nextExpanded)}
      disableGutters
      elevation={0}
      sx={{
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-card)",
        backgroundColor: "var(--color-bg-card)",
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: "var(--color-text-muted)" }} />}
        sx={{ px: 3, py: 1.5, alignItems: "flex-start" }}
      >
        <Stack spacing={1.5} sx={{ width: "100%", pr: 1 }}>
          <Box>
            <Chip
              label={LENS_LABELS[data.lens]}
              size="small"
              sx={{
                fontSize: "10px",
                height: "18px",
                backgroundColor: "var(--color-accent-secondary-soft)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border-subtle)",
                fontWeight: 500,
              }}
            />
          </Box>

          <Typography
            variant="body1"
            sx={{
              color: "var(--color-text-secondary)",
              lineHeight: 1.7,
            }}
          >
            {data.hypothesisText}
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 3, pb: 2.5, pt: 0 }}>
        <Stack spacing={2}>
          <Typography
            variant="caption"
            sx={{
              color: "var(--color-text-muted)",
              fontStyle: "italic",
            }}
          >
            One possible interpretation, not a conclusion.
          </Typography>

          <Box>
            <Typography
              variant="overline"
              sx={{
                color: "var(--color-text-muted)",
                fontSize: "10px",
                letterSpacing: "0.1em",
                fontWeight: 600,
                display: "block",
                mb: 0.75,
              }}
            >
              Reflective Question
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "var(--color-text-secondary)",
                fontStyle: "italic",
              }}
            >
              {data.reflectiveQuestion}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="overline"
              sx={{
                color: "var(--color-text-muted)",
                fontSize: "10px",
                letterSpacing: "0.1em",
                fontWeight: 600,
                display: "block",
                mb: 1,
              }}
            >
              Evidence References
            </Typography>
            <Stack spacing={1}>
              {data.evidence.map((ev, idx) => (
                <Stack
                  key={`${ev.refId}-${idx}`}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Chip
                    size="small"
                    label={`${evidenceTypeLabel[ev.type] ?? "Evidence"} - ${ev.refId}`}
                    sx={{
                      height: "22px",
                      fontSize: "11px",
                      color: "var(--color-text-primary)",
                      backgroundColor: "var(--color-accent-primary-soft)",
                      border: "1px solid var(--color-border-subtle)",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--color-text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    "{ev.quote}"
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant={isResonates ? "contained" : "outlined"}
              size="small"
              startIcon={
                isResonates ? (
                  <ThumbUpIcon fontSize="small" />
                ) : (
                  <ThumbUpOutlinedIcon fontSize="small" />
                )
              }
              onClick={() => onFeedback?.(id, "resonates")}
              disabled={isSavingFeedback}
              sx={{
                color: isResonates ? "white" : "var(--color-text-muted)",
                borderColor: isResonates ? undefined : "var(--color-border-subtle)",
                backgroundColor: isResonates ? "var(--color-success)" : undefined,
                textTransform: "none",
                fontSize: "12px",
                flex: 1,
              }}
            >
              Resonates
            </Button>
            <Button
              variant={isDoesNotFit ? "contained" : "outlined"}
              size="small"
              startIcon={
                isDoesNotFit ? (
                  <ThumbDownIcon fontSize="small" />
                ) : (
                  <ThumbDownOutlinedIcon fontSize="small" />
                )
              }
              onClick={() => onFeedback?.(id, "does_not_fit")}
              disabled={isSavingFeedback}
              sx={{
                color: isDoesNotFit ? "white" : "var(--color-text-muted)",
                borderColor: isDoesNotFit ? undefined : "var(--color-border-subtle)",
                backgroundColor: isDoesNotFit ? "var(--color-error)" : undefined,
                textTransform: "none",
                fontSize: "12px",
                flex: 1,
              }}
            >
              Doesn't fit
            </Button>
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
