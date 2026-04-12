/**
 * src/entities/association/ui/AssociationCard.tsx
 *
 * Molecule card for displaying one association with editing and deletion.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  InputBase,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

import type {
  AssociationDoc,
  AssociationId,
  EmotionalValence,
} from "../../../shared/types/domain";

interface AssociationCardProps {
  association: { id: AssociationId; data: AssociationDoc };
  elementLabel?: string;
  onDelete?: (id: AssociationId) => void;
  onEdit?: (
    id: AssociationId,
    patch: {
      associationText?: string;
      emotionalValence?: EmotionalValence;
      salience?: number;
    }
  ) => void;
}

const VALENCE_LABELS: Record<EmotionalValence, string> = {
  positive: "Positive",
  negative: "Negative",
  mixed: "Mixed",
};

const VALENCE_COLORS: Record<EmotionalValence, string> = {
  positive: "#10b981",
  negative: "#ef4444",
  mixed: "#f59e0b",
};

function SalienceDots({
  salience,
  onSalienceChange,
  interactive = false,
}: {
  salience: number;
  onSalienceChange?: (newSalience: number) => void;
  interactive?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((dot) => (
        <Box
          key={dot}
          onClick={() => interactive && onSalienceChange?.(dot)}
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor:
              dot <= salience ? "var(--color-accent-primary, #00d4ff)" : "rgba(0, 212, 255, 0.2)",
            cursor: interactive ? "pointer" : "default",
            transition: "all 0.15s",
            "&:hover": interactive ? { opacity: 0.7 } : {},
          }}
        />
      ))}
    </Box>
  );
}

export default function AssociationCard({
  association,
  elementLabel,
  onDelete,
  onEdit,
}: AssociationCardProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(association.data.associationText);
  const [editValence, setEditValence] = useState(association.data.emotionalValence);
  const [editSalience, setEditSalience] = useState(association.data.salience);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const commitEdit = useCallback(() => {
    const trimmed = editText.trim();
    if (!trimmed) {
      setEditText(association.data.associationText);
      setEditing(false);
      return;
    }

    const patch: {
      associationText?: string;
      emotionalValence?: EmotionalValence;
      salience?: number;
    } = {};

    if (trimmed !== association.data.associationText) patch.associationText = trimmed;
    if (editValence !== association.data.emotionalValence) patch.emotionalValence = editValence;
    if (editSalience !== association.data.salience) patch.salience = editSalience;

    if (Object.keys(patch).length > 0) {
      onEdit?.(association.id, patch);
    }
    setEditing(false);
  }, [editText, editValence, editSalience, association, onEdit]);

  const cancelEdit = useCallback(() => {
    setEditText(association.data.associationText);
    setEditValence(association.data.emotionalValence);
    setEditSalience(association.data.salience);
    setEditing(false);
  }, [association.data]);

  if (editing) {
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
          {/* Text input */}
          <InputBase
            inputRef={inputRef}
            multiline
            minRows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancelEdit();
            }}
            sx={{
              fontSize: "14px",
              width: "100%",
              padding: 1,
              borderRadius: 1,
              border: "1px solid rgba(0, 212, 255, 0.2)",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              "& input, & textarea": { py: 0.5 },
            }}
            placeholder="Your association"
          />

          {/* Valence toggle */}
          <Box>
            <Typography variant="caption" sx={{ color: "var(--color-text-muted, #64748b)" }}>
              Emotional tone
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={editValence}
              onChange={(_, newVal) => {
                if (newVal) setEditValence(newVal);
              }}
              fullWidth
              sx={{ mt: 0.5 }}
            >
              {(["positive", "mixed", "negative"] as const).map((val) => (
                <ToggleButton
                  key={val}
                  value={val}
                  sx={{
                    color: VALENCE_COLORS[val],
                    borderColor: `${VALENCE_COLORS[val]}40`,
                    "&.Mui-selected": {
                      backgroundColor: `${VALENCE_COLORS[val]}18`,
                      borderColor: VALENCE_COLORS[val],
                      color: VALENCE_COLORS[val],
                    },
                    fontSize: "12px",
                    textTransform: "none",
                  }}
                >
                  {VALENCE_LABELS[val]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Salience dots */}
          <Box>
            <Typography variant="caption" sx={{ color: "var(--color-text-muted, #64748b)", display: "block", mb: 0.75 }}>
              Salience (personal resonance)
            </Typography>
            <SalienceDots salience={editSalience} onSalienceChange={setEditSalience} interactive />
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Cancel">
              <IconButton
                size="small"
                onClick={cancelEdit}
                sx={{ color: "var(--color-text-muted, #64748b)" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Save">
              <IconButton
                size="small"
                onClick={commitEdit}
                sx={{ color: "var(--color-accent-primary, #00d4ff)" }}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        px: 3,
        py: 2.5,
        borderColor: "rgba(0, 212, 255, 0.12)",
        backgroundColor: "rgba(15, 22, 41, 0.8)",
        "&:hover .association-actions": { opacity: 1 },
      }}
    >
      <Stack spacing={1.5}>
        {/* Header: element label, valence, salience */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
            {elementLabel && (
              <Chip
                label={elementLabel}
                size="small"
                sx={{
                  fontSize: "10px",
                  height: "18px",
                  backgroundColor: "rgba(0, 212, 255, 0.15)",
                  color: "var(--color-accent-primary, #00d4ff)",
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              />
            )}
            <Typography
              variant="caption"
              sx={{
                color: VALENCE_COLORS[association.data.emotionalValence],
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontSize: "10px",
              }}
            >
              {VALENCE_LABELS[association.data.emotionalValence]}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <SalienceDots salience={association.data.salience} />
          </Box>
        </Box>

        {/* Association text */}
        <Typography
          variant="body2"
          sx={{
            color: "var(--color-text-primary, #e2e8f0)",
            lineHeight: 1.6,
          }}
        >
          {association.data.associationText}
        </Typography>

        {/* Action icons (fade in on hover) */}
        <Box
          className="association-actions"
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 0.5,
            opacity: { xs: 1, sm: 0 },
            transition: "opacity 0.15s",
          }}
        >
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => setEditing(true)}
              sx={{
                color: "var(--color-text-muted, #64748b)",
                "&:hover": { color: "var(--color-accent-primary, #00d4ff)" },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => onDelete?.(association.id)}
              sx={{
                color: "var(--color-text-muted, #64748b)",
                "&:hover": { color: "var(--color-error, #ef4444)" },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>
    </Paper>
  );
}
