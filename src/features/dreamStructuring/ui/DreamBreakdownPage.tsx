/**
 * src/features/dreamStructuring/ui/DreamBreakdownPage.tsx
 *
 * DRM-11: Dream Breakdown — editable extracted elements.
 *
 * Flow:
 *  1. Load dream from Firestore.
 *  2. Show BYOK gate + "Extract elements" button when elements are absent.
 *  3. After extraction (or on revisit), show elements grouped by kind.
 *  4. Each element is editable (label) and soft-deletable.
 *  5. User can add elements manually.
 *  6. "Continue" advances to Associations (placeholder route for now).
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Firestore } from "firebase/firestore";
import { doc, collection } from "firebase/firestore";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  InputBase,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ByokGate from "../../byok/ui/ByokGate";
import { getLlmApiKey, hasLlmApiKey } from "../../byok/service/keyStorage.service";
import { extractElements } from "../service/extractElements.service";
import {
  getDream,
  listElements,
  upsertElement,
  softDeleteElement,
} from "../../../services/firestore/firestoreRepo";
import { nowTs } from "../../../services/firestore/timestamps";
import { defaults } from "../../../shared/types/domain";
import type {
  DreamDoc,
  DreamElementDoc,
  DreamId,
  ElementId,
  ElementKind,
  UID,
} from "../../../shared/types/domain";
import { LlmError } from "../../../services/ai/client/llmClient";

// ─── Types ──────────────────────────────────────────────────────────────────

type LocalElement = { id: ElementId; data: DreamElementDoc };

type PageStatus =
  | "loading"
  | "ready"
  | "extracting"
  | "error";

// ─── Constants ──────────────────────────────────────────────────────────────

const KIND_ORDER: ElementKind[] = [
  "symbol",
  "character",
  "place",
  "emotion",
  "action",
  "shift",
];

const KIND_LABELS: Record<ElementKind, string> = {
  symbol: "Symbols",
  character: "Characters",
  place: "Places",
  emotion: "Emotions",
  action: "Actions",
  shift: "Shifts",
};

const KIND_COLORS: Record<ElementKind, string> = {
  symbol: "#a78bfa",
  character: "#00d4ff",
  place: "#f59e0b",
  emotion: "#f472b6",
  action: "#10b981",
  shift: "#61dafb",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function KindChip({ kind }: { kind: ElementKind }) {
  return (
    <Chip
      label={kind}
      size="small"
      sx={{
        fontSize: "10px",
        height: "18px",
        backgroundColor: `${KIND_COLORS[kind]}18`,
        color: KIND_COLORS[kind],
        border: `1px solid ${KIND_COLORS[kind]}40`,
        fontWeight: 500,
      }}
    />
  );
}

interface ElementCardProps {
  element: LocalElement;
  onLabelChange: (id: ElementId, newLabel: string) => void;
  onDelete: (id: ElementId) => void;
}

function ElementCard({ element, onLabelChange, onDelete }: ElementCardProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(element.data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== element.data.label) {
      onLabelChange(element.id, trimmed);
    } else {
      setEditValue(element.data.label);
    }
    setEditing(false);
  }, [editValue, element, onLabelChange]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <Paper
      variant="outlined"
      sx={{
        px: 2,
        py: 1.5,
        borderColor: "rgba(0, 212, 255, 0.12)",
        backgroundColor: "rgba(15, 22, 41, 0.8)",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        "&:hover .element-actions": { opacity: 1 },
      }}
    >
      <KindChip kind={element.data.kind} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <InputBase
            inputRef={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") {
                setEditValue(element.data.label);
                setEditing(false);
              }
            }}
            sx={{
              fontSize: "14px",
              width: "100%",
              "& input": { py: 0 },
            }}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: "var(--color-text-primary, #e2e8f0)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {element.data.label}
          </Typography>
        )}
        {element.data.evidence && element.data.evidence.length > 0 && !editing && (
          <Typography
            variant="caption"
            sx={{
              color: "var(--color-text-muted, #64748b)",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            "{element.data.evidence[0]}"
          </Typography>
        )}
      </Box>

      <Stack
        className="element-actions"
        direction="row"
        spacing={0.5}
        sx={{ opacity: { xs: 1, sm: 0 }, transition: "opacity 0.15s" }}
      >
        {editing ? (
          <Tooltip title="Confirm">
            <IconButton size="small" onClick={commitEdit} aria-label="Confirm edit">
              <CheckIcon fontSize="small" sx={{ color: "var(--color-accent-primary, #00d4ff)" }} />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Edit label">
            <IconButton
              size="small"
              onClick={() => setEditing(true)}
              aria-label="Edit element label"
            >
              <EditIcon fontSize="small" sx={{ color: "var(--color-text-secondary, #94a3b8)" }} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Remove">
          <IconButton
            size="small"
            onClick={() => onDelete(element.id)}
            aria-label="Remove element"
          >
            <DeleteOutlineIcon
              fontSize="small"
              sx={{ color: "var(--color-text-muted, #64748b)" }}
            />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
}

interface AddElementRowProps {
  kind: ElementKind;
  onAdd: (kind: ElementKind, label: string) => void;
}

function AddElementRow({ kind, onAdd }: AddElementRowProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(kind, trimmed);
      setValue("");
    }
    setOpen(false);
  };

  if (!open) {
    return (
      <Button
        variant="text"
        size="small"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        sx={{
          color: "var(--color-text-muted, #64748b)",
          textTransform: "none",
          fontSize: "12px",
          alignSelf: "flex-start",
          "&:hover": { color: "var(--color-accent-primary, #00d4ff)" },
        }}
      >
        Add {KIND_LABELS[kind].toLowerCase().replace(/s$/, "")}
      </Button>
    );
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <TextField
        inputRef={inputRef}
        size="small"
        placeholder={`New ${kind}…`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue("");
            setOpen(false);
          }
        }}
        sx={{
          width: 200,
          "& .MuiInputBase-root": {
            fontSize: "13px",
            backgroundColor: "rgba(15, 22, 41, 0.6)",
          },
        }}
      />
      <Button size="small" onClick={commit} sx={{ minWidth: 0 }}>
        Add
      </Button>
    </Stack>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

type DreamBreakdownPageProps = {
  db: Firestore;
  uid: UID;
  dreamId: DreamId;
  onContinue?: (dreamId: DreamId) => void;
};

export default function DreamBreakdownPage({
  db,
  uid,
  dreamId,
  onContinue,
}: DreamBreakdownPageProps) {
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [dream, setDream] = useState<DreamDoc | null>(null);
  const [elements, setElements] = useState<LocalElement[]>([]);
  const [extractError, setExtractError] = useState<string | null>(null);

  // ── Load dream + existing elements ────────────────────────────────────────
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [dreamDoc, existingElements] = await Promise.all([
          getDream(db, uid, dreamId),
          listElements(db, uid, dreamId),
        ]);

        if (!active) return;

        if (!dreamDoc) {
          setPageStatus("error");
          return;
        }

        setDream(dreamDoc);
        setElements(existingElements);
        setPageStatus("ready");
      } catch {
        if (active) setPageStatus("error");
      }
    }

    void load();
    return () => { active = false; };
  }, [db, uid, dreamId]);

  // ── Extract elements ───────────────────────────────────────────────────────
  const handleExtract = async () => {
    if (!dream) return;
    const apiKey = getLlmApiKey();
    if (!apiKey) return;

    setPageStatus("extracting");
    setExtractError(null);

    try {
      const result = await extractElements({
        db,
        uid,
        dreamId,
        rawText: dream.rawText,
        apiKey,
      });
      setElements(result.elements);
      setPageStatus("ready");
    } catch (err) {
      const msg =
        err instanceof LlmError
          ? err.message
          : "Something went wrong during extraction. Please try again.";
      setExtractError(msg);
      setPageStatus("ready");
    }
  };

  // ── Element mutations ──────────────────────────────────────────────────────
  const handleLabelChange = async (id: ElementId, newLabel: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;

    const updated: DreamElementDoc = {
      ...el.data,
      label: newLabel,
      source: "user",
      updatedAt: nowTs(),
    };

    setElements((prev) =>
      prev.map((e) => (e.id === id ? { id, data: updated } : e))
    );

    try {
      await upsertElement(db, uid, dreamId, id, updated);
    } catch {
      // Revert on failure
      setElements((prev) =>
        prev.map((e) => (e.id === id ? el : e))
      );
    }
  };

  const handleDelete = async (id: ElementId) => {
    setElements((prev) => prev.filter((e) => e.id !== id));

    try {
      await softDeleteElement(db, uid, dreamId, id);
    } catch {
      // Revert on failure — re-load
      const reloaded = await listElements(db, uid, dreamId);
      setElements(reloaded);
    }
  };

  const handleAdd = async (kind: ElementKind, label: string) => {
    const id = doc(collection(db, "_")).id as ElementId;
    const data = defaults.element({
      kind,
      label,
      source: "user",
      order: elements.filter((e) => e.data.kind === kind).length,
      createdAt: nowTs(),
    });

    const newEl: LocalElement = { id, data };
    setElements((prev) => [...prev, newEl]);

    try {
      await upsertElement(db, uid, dreamId, id, data);
    } catch {
      setElements((prev) => prev.filter((e) => e.id !== id));
    }
  };

  // ── Group elements by kind ─────────────────────────────────────────────────
  const grouped = KIND_ORDER.reduce<Record<ElementKind, LocalElement[]>>(
    (acc, kind) => {
      acc[kind] = elements.filter(
        (e) => e.data.kind === kind && !e.data.deleted
      );
      return acc;
    },
    {} as Record<ElementKind, LocalElement[]>
  );

  const hasElements = elements.filter((e) => !e.data.deleted).length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────
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
          {/* Header */}
          <Stack spacing={1}>
            <Typography
              variant="overline"
              sx={{ color: "var(--color-text-muted, #64748b)" }}
            >
              Dreamer · Step 2
            </Typography>
            <Typography
              variant="h4"
              component="h1"
              sx={{ color: "var(--color-text-primary, #e2e8f0)", fontWeight: 700 }}
            >
              Dream Breakdown
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "var(--color-text-secondary, #94a3b8)", maxWidth: 560 }}
            >
              These are the elements Dreamer found in your dream. Edit, remove, or
              add anything that feels more accurate — your sense of the dream is
              always primary.
            </Typography>
          </Stack>

          {/* Loading state */}
          {pageStatus === "loading" && (
            <Stack spacing={2}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rounded" height={56} />
              ))}
            </Stack>
          )}

          {/* Error state */}
          {pageStatus === "error" && (
            <Alert severity="error">
              Could not load this dream. Please return to the Dashboard and try
              again.
            </Alert>
          )}

          {pageStatus !== "loading" && pageStatus !== "error" && (
            <>
              {/* Dream text preview */}
              {dream && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderColor: "rgba(0, 212, 255, 0.12)",
                    backgroundColor: "rgba(15, 22, 41, 0.6)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--color-text-muted, #64748b)",
                      display: "block",
                      mb: 1,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Dream text
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "var(--color-text-secondary, #94a3b8)",
                      whiteSpace: "pre-wrap",
                      maxHeight: 120,
                      overflow: "hidden",
                      WebkitMaskImage:
                        "linear-gradient(180deg, black 60%, transparent 100%)",
                    }}
                  >
                    {dream.rawText}
                  </Typography>
                </Paper>
              )}

              {/* Extraction trigger (when no elements yet) */}
              {!hasElements && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderColor: "rgba(0, 212, 255, 0.12)",
                    backgroundColor: "rgba(15, 22, 41, 0.8)",
                  }}
                >
                  <Stack spacing={2.5}>
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{ color: "var(--color-text-primary, #e2e8f0)" }}
                    >
                      Extract elements
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "var(--color-text-secondary, #94a3b8)" }}
                    >
                      Dreamer will read your dream and identify its characters,
                      symbols, places, emotions, and actions — without any
                      interpretation.
                    </Typography>

                    {hasLlmApiKey() ? (
                      <Stack spacing={1.5}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={
                            pageStatus === "extracting" ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <AutoAwesomeIcon fontSize="small" />
                            )
                          }
                          onClick={handleExtract}
                          disabled={pageStatus === "extracting"}
                          sx={{ alignSelf: "flex-start" }}
                        >
                          {pageStatus === "extracting"
                            ? "Extracting…"
                            : "Extract elements"}
                        </Button>
                        {extractError && (
                          <Alert severity="error">{extractError}</Alert>
                        )}
                      </Stack>
                    ) : (
                      <ByokGate>{null}</ByokGate>
                    )}
                  </Stack>
                </Paper>
              )}

              {/* Elements grouped by kind */}
              {hasElements && (
                <Stack spacing={3}>
                  {/* Re-extract option */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      variant="body2"
                      sx={{ color: "var(--color-text-muted, #64748b)" }}
                    >
                      {elements.filter((e) => !e.data.deleted).length} elements
                    </Typography>
                    {hasLlmApiKey() && (
                      <Button
                        variant="text"
                        size="small"
                        startIcon={
                          pageStatus === "extracting" ? (
                            <CircularProgress size={12} color="inherit" />
                          ) : (
                            <AutoAwesomeIcon fontSize="small" />
                          )
                        }
                        onClick={handleExtract}
                        disabled={pageStatus === "extracting"}
                        sx={{
                          color: "var(--color-text-muted, #64748b)",
                          textTransform: "none",
                          fontSize: "12px",
                        }}
                      >
                        Re-extract
                      </Button>
                    )}
                    {extractError && (
                      <Alert severity="error" sx={{ py: 0, flex: 1 }}>
                        {extractError}
                      </Alert>
                    )}
                  </Stack>

                  {KIND_ORDER.map((kind) => {
                    const group = grouped[kind];
                    if (group.length === 0 && kind !== "symbol" && kind !== "character") {
                      // Only show non-empty groups (except symbol + character always shown)
                      return null;
                    }
                    return (
                      <Box key={kind}>
                        <Typography
                          variant="overline"
                          sx={{
                            color: KIND_COLORS[kind],
                            fontSize: "11px",
                            letterSpacing: "0.1em",
                            fontWeight: 600,
                            display: "block",
                            mb: 1,
                          }}
                        >
                          {KIND_LABELS[kind]}
                        </Typography>
                        <Stack spacing={1}>
                          {group.map((el) => (
                            <ElementCard
                              key={el.id}
                              element={el}
                              onLabelChange={handleLabelChange}
                              onDelete={handleDelete}
                            />
                          ))}
                          <AddElementRow kind={kind} onAdd={handleAdd} />
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}

              {/* Continue */}
              {hasElements && (
                <>
                  <Divider
                    sx={{ borderColor: "rgba(0, 212, 255, 0.12)" }}
                  />
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
                      When you're satisfied, continue to add your personal
                      associations.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => onContinue?.(dreamId)}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      Continue to Associations
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
