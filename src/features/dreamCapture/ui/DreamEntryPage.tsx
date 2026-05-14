import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Firestore } from "firebase/firestore";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import { getLlmApiKey } from "../../byok/service/keyStorage.service";
import { transcribeAudio } from "../../../services/ai/client/whisperClient";

type DreamEntryDeps = {
  createDream: typeof createDreamEntry;
  updateDream: typeof updateDreamEntry;
  transcribe?: typeof transcribeAudio;
  getApiKey?: typeof getLlmApiKey;
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
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const createInFlightRef = useRef<Promise<DreamId> | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const services = useMemo(
    () => ({
      createDream: deps?.createDream ?? createDreamEntry,
      updateDream: deps?.updateDream ?? updateDreamEntry,
      transcribe: deps?.transcribe ?? transcribeAudio,
      getApiKey: deps?.getApiKey ?? getLlmApiKey,
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

  const startVoiceCapture = async () => {
    setVoiceError(null);

    const apiKey = services.getApiKey();
    if (!apiKey) {
      setVoiceError("No API key found. Please add your OpenAI key in Settings.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setVoiceError("Microphone access denied. Please allow microphone and try again.");
      return;
    }

    audioChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());

      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });

      setIsTranscribing(true);
      try {
        const key = services.getApiKey();
        if (!key) throw new Error("API key disappeared before transcription.");

        const transcript = await services.transcribe({ apiKey: key, audioBlob, language: "uk" });
        if (transcript) {
          setRawText((prev) => {
            const current = prev.trim();
            return current ? `${current} ${transcript}` : transcript;
          });
        }
      } catch (err) {
        setVoiceError(err instanceof Error ? err.message : "Transcription failed.");
      } finally {
        setIsTranscribing(false);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsVoiceRecording(true);
  };

  const stopVoiceCapture = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    setIsVoiceRecording(false);
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const voiceButtonLabel = isTranscribing
    ? "Transcribing…"
    : isVoiceRecording
      ? "Stop recording"
      : "Start voice recording";

  const voiceButtonDisabled = isTranscribing;

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
              color={isVoiceRecording ? "error" : "primary"}
              onClick={isVoiceRecording ? stopVoiceCapture : () => void startVoiceCapture()}
              disabled={voiceButtonDisabled}
              startIcon={isTranscribing ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {voiceButtonLabel}
            </Button>
            <Typography variant="body2" sx={{ color: "var(--color-text-secondary, #94a3b8)" }}>
              {isVoiceRecording
                ? "Записую… Натисніть «Stop recording» коли закінчите."
                : isTranscribing
                  ? "Розпізнаю мову через Whisper…"
                  : "Говоріть українською — Whisper розпізнає і додасть текст."}
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
