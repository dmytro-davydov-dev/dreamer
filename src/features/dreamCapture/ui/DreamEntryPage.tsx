import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Firestore } from "firebase/firestore";
import {
  Alert,
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

type SpeechRecognitionResultLike = {
  0: { transcript: string };
  isFinal: boolean;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

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
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const createInFlightRef = useRef<Promise<DreamId> | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const services = useMemo(
    () => ({
      createDream: deps?.createDream ?? createDreamEntry,
      updateDream: deps?.updateDream ?? updateDreamEntry,
    }),
    [deps]
  );

  const isContinueEnabled = rawText.trim().length > 0;

  const getSpeechRecognitionCtor = useCallback(() => {
    if (typeof window === "undefined") return undefined;
    const speechWindow = window as WindowWithSpeechRecognition;
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  }, []);

  useEffect(() => {
    setVoiceSupported(Boolean(getSpeechRecognitionCtor()));
  }, [getSpeechRecognitionCtor]);

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

  const startVoiceCapture = () => {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();

    if (!SpeechRecognitionCtor) {
      setVoiceError("Voice capture is not supported in this browser.");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const finalChunks: string[] = [];

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) {
            finalChunks.push(result[0].transcript.trim());
          }
        }

        if (finalChunks.length === 0) return;

        const chunk = finalChunks.join(" ").trim();
        if (!chunk) return;

        setRawText((prev) => {
          const current = prev.trim();
          return current ? `${current} ${chunk}` : chunk;
        });
      };

      recognition.onerror = (event) => {
        setVoiceError(`Voice capture error: ${event.error}`);
        setIsVoiceRecording(false);
      };

      recognition.onend = () => {
        setIsVoiceRecording(false);
      };

      recognitionRef.current = recognition;
    }

    setVoiceError(null);

    try {
      recognitionRef.current.start();
      setIsVoiceRecording(true);
    } catch {
      setVoiceError("Could not start voice capture. Please try again.");
      setIsVoiceRecording(false);
    }
  };

  const stopVoiceCapture = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsVoiceRecording(false);
  };

  useEffect(() => {
    return () => {
      if (!recognitionRef.current) return;
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    };
  }, []);

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

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
            <Button
              variant={isVoiceRecording ? "outlined" : "contained"}
              color="primary"
              onClick={isVoiceRecording ? stopVoiceCapture : startVoiceCapture}
              disabled={!voiceSupported && !isVoiceRecording}
            >
              {isVoiceRecording ? "Stop voice capture" : "Start voice capture"}
            </Button>
            <Typography variant="body2" sx={{ color: "var(--color-text-secondary, #94a3b8)" }}>
              {voiceSupported
                ? "Speak naturally. Your words will be appended to the dream text."
                : "Voice capture is unavailable in this browser. You can still type your dream."}
            </Typography>
          </Stack>

          {voiceError && (
            <Alert severity="warning" role="alert">
              {voiceError}
            </Alert>
          )}

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
