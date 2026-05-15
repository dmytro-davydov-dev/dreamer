import type { ElementKind, JungianLens, HypothesisFeedback, EmotionalValence } from "../../shared/types/domain";
import type { LlmErrorKind } from "../ai/client/llmClient";

export type WordCountBucket = "<50" | "50-150" | "150-500" | "500+";
export type AiStage = "extract" | "interpret" | "integrate";

// Layer 1 — User Lifecycle
type UserCreatedEvent = { event: "user_created"; authMethod: "anonymous" };
type DisclaimerAcceptedEvent = { event: "disclaimer_accepted"; sessionNumber: number };

// Layer 2 — Session & Dream Activation
type SessionStartedEvent = { event: "session_started"; sessionNumber: number; totalDreamsOnRecord: number };
type DreamCaptureStartedEvent = { event: "dream_capture_started"; sessionNumber: number };
type DreamSubmittedEvent = { event: "dream_submitted"; wordCountBucket: WordCountBucket; hasLifeContext: boolean; hasMood: boolean };
type FirstDreamCompletedEvent = { event: "first_dream_completed"; minutesFromCaptureToDone: number };

// Layer 3 — Feature Interaction Events
type StructuringTriggeredEvent = { event: "structuring_triggered"; dreamId: string };
type ElementEditedEvent = { event: "element_edited"; elementKind: ElementKind };
type ElementDeletedEvent = { event: "element_deleted"; elementKind: ElementKind };
type ElementAddedManuallyEvent = { event: "element_added_manually"; elementKind: ElementKind };
type AssociationAddedEvent = { event: "association_added"; emotionalValence: EmotionalValence; salience: 1 | 2 | 3 | 4 | 5 };
type InterpretationTriggeredEvent = { event: "interpretation_triggered"; associationCount: number; elementCount: number };
type HypothesisFeedbackGivenEvent = { event: "hypothesis_feedback_given"; lens: JungianLens; feedback: HypothesisFeedback; hypothesisIndex: number };
type IntegrationTriggeredEvent = { event: "integration_triggered" };
type JournalSavedEvent = { event: "journal_saved"; wordCountBucket: WordCountBucket };
type DreamHistoryOpenedEvent = { event: "dream_history_opened"; totalDreamsOnRecord: number };
type PastDreamReplayedEvent = { event: "past_dream_replayed" };

// Layer 4 — AI-Specific Events
type AiStageCompletedEvent = { event: "ai_stage_completed"; stage: AiStage; latencyMs: number; promptTokens: number; completionTokens: number; model: string; success: true };
type AiStageFailedEvent = { event: "ai_stage_failed"; stage: AiStage; errorKind: LlmErrorKind; latencyMs: number };

export type AnalyticsEvent =
  | UserCreatedEvent
  | DisclaimerAcceptedEvent
  | SessionStartedEvent
  | DreamCaptureStartedEvent
  | DreamSubmittedEvent
  | FirstDreamCompletedEvent
  | StructuringTriggeredEvent
  | ElementEditedEvent
  | ElementDeletedEvent
  | ElementAddedManuallyEvent
  | AssociationAddedEvent
  | InterpretationTriggeredEvent
  | HypothesisFeedbackGivenEvent
  | IntegrationTriggeredEvent
  | JournalSavedEvent
  | DreamHistoryOpenedEvent
  | PastDreamReplayedEvent
  | AiStageCompletedEvent
  | AiStageFailedEvent;

export type EventPayload<K extends AnalyticsEvent["event"]> = Omit<Extract<AnalyticsEvent, { event: K }>, "event">;
