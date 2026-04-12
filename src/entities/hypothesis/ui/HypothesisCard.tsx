/**
 * src/entities/hypothesis/ui/HypothesisCard.tsx
 *
 * Molecule card for displaying one hypothesis with resonance/fit feedback.
 */

import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";

import type {
  HypothesisDoc,
  HypothesisFeedback,
  HypothesisId,
  JungianLens,
} from "../../../shared/types/domain";

interface HypothesisCardProps {
  hypothesis: { id: HypothesisId; data: HypothesisDoc };
  onFeedback?: (id: HypothesisId, feedback: HypothesisFeedback) => void;
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
}: HypothesisCardProps) {
  const { id, data } = hypothesis;
  const isResonates = data.userFeedback === "resonates";
  const isDoesNotFit = data.userFeedback === "does_not_fit";

  return (
    <Paper
      variant="outlined"
      sx={{
        px: 3,
        py: 2.5,
        borderColor: "rgba(0, 212, 255, 0.12)",
        backgroundColor: "rgba(15, 22, 41, 0.8)",
      }}
    >
      <Stack spacing={2}>
        {/* Lens chip */}
        <Box>
          <Chip
            label={LENS_LABELS[data.lens]}
            size="small"
            sx={{
              fontSize: "10px",
              height: "18px",
              backgroundColor: "rgba(124, 58, 237, 0.15)",
              color: "var(--color-accent-secondary, #7c3aed)",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              fontWeight: 500,
            }}
          />
        </Box>

        {/* Hypothesis text */}
        <Typography
          variant="body1"
          sx={{
            color: "var(--color-text-secondary, #94a3b8)",
            lineHeight: 1.7,
          }}
        >
          {data.hypothesisText}
        </Typography>

        {/* Disclaimer */}
        <Typography
          variant="caption"
          sx={{
            color: "var(--color-text-muted, #64748b)",
            fontStyle: "italic",
          }}
        >
          One possible interpretation — not a conclusion.
        </Typography>

        <Divider sx={{ borderColor: "rgba(0, 212, 255, 0.1)", my: 0.5 }} />

        {/* Reflective question */}
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: "var(--color-text-muted, #64748b)",
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
              color: "var(--color-text-secondary, #94a3b8)",
              fontStyle: "italic",
            }}
          >
            {data.reflectiveQuestion}
          </Typography>
        </Box>

        {/* Evidence */}
        {data.evidence && data.evidence.length > 0 && (
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "var(--color-text-muted, #64748b)",
                display: "block",
                mb: 0.75,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              Evidence
            </Typography>
            <Stack spacing={0.75}>
              {data.evidence.map((ev, idx) => (
                <Typography
                  key={idx}
                  variant="caption"
                  sx={{
                    color: "var(--color-text-muted, #64748b)",
                    fontStyle: "italic",
                  }}
                >
                  — {ev.quote}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

        <Divider sx={{ borderColor: "rgba(0, 212, 255, 0.1)", my: 0.5 }} />

        {/* Feedback buttons */}
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
            onClick={() =>
              onFeedback?.(id, isResonates ? "resonates" : "resonates")
            }
            sx={{
              color: isResonates ? "white" : "var(--color-text-muted, #64748b)",
              borderColor: isResonates ? undefined : "rgba(0, 212, 255, 0.2)",
              backgroundColor: isResonates ? "var(--color-success, #10b981)" : undefined,
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
            onClick={() =>
              onFeedback?.(id, isDoesNotFit ? "does_not_fit" : "does_not_fit")
            }
            sx={{
              color: isDoesNotFit ? "white" : "var(--color-text-muted, #64748b)",
              borderColor: isDoesNotFit ? undefined : "rgba(0, 212, 255, 0.2)",
              backgroundColor: isDoesNotFit ? "var(--color-error, #ef4444)" : undefined,
              textTransform: "none",
              fontSize: "12px",
              flex: 1,
            }}
          >
            Doesn't fit
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
