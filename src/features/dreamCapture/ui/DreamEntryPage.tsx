import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Firestore } from "firebase/firestore";
import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import type { DreamId, UID } from "../../../shared/types/domain";
import type {
  CreateDreamInput,
  UpdateDreamInput,
} from "../../../services/firestore/firestoreRepo";
import {
  createDreamEntry,
  updateDreamEntry,
} from "../service/dreamCapture.service";

type DreamEntryDeps = {
  createDream: typeof createDreamEntry;
  updateDream: typeof updateDreamEntry;
};

type DreamEntryPageProps = {
  db: Firestore;
  uid: UID;
  dreamId?: DreamId;
  autosaveDelayMs?: number;
  onContinue?: (dreamId: DreamId) => void;
  deps?: DreamEntryDeps;
};

const DEFAULT_AUTOSAVE_MS = 600;

export default function DreamEntryPage({
  db,
  uid,
  dreamId,
  autosaveDelayMs = DEFAULT_AUTOSAVE_MS,
  onContinue,
  deps,
}: DreamEntryPageProps) {
  const [rawText, setRawText] = useState("");
  const [mood, setMood] = useState("");
  const [lifeContext, setLifeContext] = useState("");
  const [draftId, setDraftId] = useState<DreamId | null>(dreamId ?? null);

  const createInFlightRef = useRef<Promise<DreamId> | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  const services = useMemo(
    () => ({
      createDream: deps?.createDream ?? createDreamEntry,
      updateDream: deps?.updateDream ?? updateDreamEntry,
    }),
    [deps]
  );

  const isContinueEnabled = rawText.trim().length > 0;

  const buildCreateInput = (): CreateDreamInput | null => {
    const trimmed = rawText.trim();
    if (!trimmed) return null;

    const moodValue = mood.trim();
    const lifeContextValue = lifeContext.trim();

    return {
      rawText: trimmed,
      ...(moodValue ? { mood: moodValue } : {}),
      ...(lifeContextValue ? { lifeContext: lifeContextValue } : {}),
    };
  };

  const buildUpdatePatch = (): UpdateDreamInput => {
    const moodValue = mood.trim();
    const lifeContextValue = lifeContext.trim();

    return {
      rawText,
      ...(moodValue ? { mood: moodValue } : { mood: "" }),
      ...(lifeContextValue ? { lifeContext: lifeContextValue } : { lifeContext: "" }),
    };
  };

  const saveDraft = useCallback(async () => {
    if (draftId) {
      await services.updateDream(db, uid, draftId, buildUpdatePatch());
      return;
    }

    if (createInFlightRef.current) {
      await createInFlightRef.current;
      return;
    }

    const createInput = buildCreateInput();
    if (!createInput) return;

    const createPromise = services
      .createDream(db, uid, createInput)
      .then((result) => result.dreamId);

    createInFlightRef.current = createPromise;

    try {
      const createdId = await createPromise;
      setDraftId(createdId);
    } finally {
      createInFlightRef.current = null;
    }
  }, [db, uid, draftId, services, rawText, mood, lifeContext]);

  const scheduleAutosave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void saveDraft();
    }, autosaveDelayMs);
  }, [autosaveDelayMs, saveDraft]);

  useEffect(() => {
    scheduleAutosave();
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [rawText, mood, lifeContext, scheduleAutosave]);

  const handleContinue = async () => {
    await saveDraft();
    if (draftId && onContinue) onContinue(draftId);
  };

  const handleBlur = () => {
    void saveDraft();
  };

  return (
    <Box
      component="main"
      aria-label="Dream Entry"
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
              Dreamer · Step 1
            </Typography>
            <Typography
              variant="h4"
              component="h1"
              sx={{ color: "var(--color-text-primary, #e2e8f0)", fontWeight: 700 }}
            >
              Record your dream
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "var(--color-text-secondary, #94a3b8)", maxWidth: 520 }}
            >
              Capture your dream as you remember it — no detail is too small.
            </Typography>
          </Stack>

          {/* Dream text */}
          <TextField
            id="dream-text"
            name="dreamText"
            label="Dream"
            placeholder="Write your dream as you remember it..."
            multiline
            minRows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onBlur={handleBlur}
            fullWidth
          />

          {/* Mood */}
          <TextField
            id="dream-mood"
            name="mood"
            label="Waking mood (optional)"
            placeholder="e.g. anxious, peaceful, curious..."
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onBlur={handleBlur}
            fullWidth
          />

          {/* Life context */}
          <TextField
            id="dream-context"
            name="lifeContext"
            label="Life context (optional)"
            placeholder="What's been on your mind lately?"
            multiline
            minRows={4}
            value={lifeContext}
            onChange={(e) => setLifeContext(e.target.value)}
            onBlur={handleBlur}
            fullWidth
          />

          {/* Continue */}
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              endIcon={<ArrowForwardIcon />}
              disabled={!isContinueEnabled}
              onClick={handleContinue}
              sx={{ minWidth: 160 }}
            >
              Continue
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
