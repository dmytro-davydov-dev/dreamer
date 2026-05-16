/**
 * src/features/dreamAssociations/ui/AssociationsPage.tsx
 *
 * DRM-12: Personal Associations -- symbol-by-symbol association entry.
 */

import { useCallback, useEffect, useState } from "react";
import type { Firestore } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  getDream,
  listElements,
  listAssociations,
  createAssociation,
  updateAssociation,
  deleteAssociation,
} from "../../../services/firestore/firestoreRepo";
import { nowTs } from "../../../services/firestore/timestamps";
import { AssociationCard } from "../../../entities/association/ui";
import { analytics } from "../../../services/analytics";
import type {
  AssociationDoc,
  AssociationId,
  DreamElementDoc,
  DreamId,
  ElementId,
  EmotionalValence,
  UID,
} from "../../../shared/types/domain";

type PageStatus = "loading" | "ready" | "error";

interface LocalAssociationMap {
  [elementId: string]: { id: AssociationId; data: AssociationDoc } | undefined;
}

interface AssociationsPageProps {
  db: Firestore;
  uid: UID;
  dreamId: DreamId;
  onContinue?: (dreamId: DreamId) => void;
}

function SalienceInput({
  value,
  onChange,
}: {
  value: number;
  onChange?: (newValue: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" sx={{ color: "var(--color-text-muted, #64748b)" }}>
        {t("associations.salience")}
      </Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        {[1, 2, 3, 4, 5].map((num) => (
          <Tooltip key={num} title={`${num}`}>
            <Button
              variant={value === num ? "contained" : "outlined"}
              size="small"
              onClick={() => onChange?.(num)}
              sx={{
                minWidth: 32,
                width: 32,
                height: 32,
                padding: 0,
                color: value === num ? "white" : "var(--color-text-muted, #64748b)",
                backgroundColor:
                  value === num ? "var(--color-accent-primary, #00d4ff)" : undefined,
                borderColor: "rgba(0, 212, 255, 0.2)",
              }}
            >
              {num}
            </Button>
          </Tooltip>
        ))}
      </Box>
    </Stack>
  );
}

export default function AssociationsPage({
  db,
  uid,
  dreamId,
  onContinue,
}: AssociationsPageProps) {
  const { t } = useTranslation();
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [elements, setElements] = useState<Array<{ id: ElementId; data: DreamElementDoc }>>([]);
  const [associationMap, setAssociationMap] = useState<LocalAssociationMap>({});
  const [error, setError] = useState<string>("");
  const [savingId, setSavingId] = useState<ElementId | null>(null);

  const [formState, setFormState] = useState<
    Record<
      ElementId,
      {
        text: string;
        valence: EmotionalValence;
        salience: number;
      }
    >
  >({});

  useEffect(() => {
    const load = async () => {
      try {
        const [dreamDoc, elements, associations] = await Promise.all([
          getDream(db, uid, dreamId),
          listElements(db, uid, dreamId),
          listAssociations(db, uid, dreamId),
        ]);

        if (!dreamDoc) {
          setError(t("associations.errors.dreamNotFound"));
          setPageStatus("error");
          return;
        }


        const activeElements = elements.filter((el) => !el.data.deleted);
        setElements(activeElements);

        const assocMap: LocalAssociationMap = {};
        associations.forEach((assoc) => {
          assocMap[assoc.data.elementId] = assoc;
        });
        setAssociationMap(assocMap);

        const initForm: typeof formState = {};
        activeElements.forEach((el) => {
          initForm[el.id] = {
            text: "",
            valence: "mixed",
            salience: 3,
          };
        });
        setFormState(initForm);

        setPageStatus("ready");
      } catch (err) {
        console.error("Failed to load associations page:", err);
        setError(t("associations.errors.loadDreamFailed"));
        setPageStatus("error");
      }
    };

    load();
  }, [db, uid, dreamId]);

  const handleCreate = useCallback(
    async (elementId: ElementId) => {
      const form = formState[elementId];
      if (!form || !form.text.trim()) return;

      setSavingId(elementId);
      try {
        const result = await createAssociation(db, uid, dreamId, {
          elementId,
          associationText: form.text.trim(),
          emotionalValence: form.valence,
          salience: form.salience,
        });

        setAssociationMap((prev) => ({
          ...prev,
          [elementId]: result,
        }));

        analytics.capture("association_added", {
          emotionalValence: form.valence,
          salience: form.salience as 1 | 2 | 3 | 4 | 5,
        });

        setFormState((prev) => ({
          ...prev,
          [elementId]: { text: "", valence: "mixed", salience: 3 },
        }));
      } catch (err) {
        console.error("Failed to create association:", err);
        setError(t("associations.errors.saveFailed"));
      } finally {
        setSavingId(null);
      }
    },
    [db, uid, dreamId, formState]
  );

  const handleEdit = useCallback(
    async (
      elementId: ElementId,
      associationId: AssociationId,
      patch: {
        associationText?: string;
        emotionalValence?: EmotionalValence;
        salience?: number;
      }
    ) => {
      setSavingId(elementId);
      try {
        await updateAssociation(db, uid, dreamId, associationId, patch);

        setAssociationMap((prev) => {
          const current = prev[elementId];
          if (!current) return prev;

          return {
            ...prev,
            [elementId]: {
              ...current,
              data: {
                ...current.data,
                ...patch,
                updatedAt: nowTs(),
              },
            },
          };
        });
      } catch (err) {
        console.error("Failed to update association:", err);
        setError(t("associations.errors.updateFailed"));
      } finally {
        setSavingId(null);
      }
    },
    [db, uid, dreamId]
  );

  const handleDelete = useCallback(
    async (elementId: ElementId, associationId: AssociationId) => {
      setSavingId(elementId);
      try {
        await deleteAssociation(db, uid, dreamId, associationId);

        setAssociationMap((prev) => {
          const newMap = { ...prev };
          delete newMap[elementId];
          return newMap;
        });
      } catch (err) {
        console.error("Failed to delete association:", err);
        setError(t("associations.errors.deleteFailed"));
      } finally {
        setSavingId(null);
      }
    },
    [db, uid, dreamId]
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
              {t("associations.step")}
            </Typography>
            <Typography
              variant="h4"
              component="h1"
              sx={{ color: "var(--color-text-primary, #e2e8f0)", fontWeight: 700 }}
            >
              {t("associations.title")}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "var(--color-text-secondary, #94a3b8)", maxWidth: 560 }}
            >
              {t("associations.subtitle")}
            </Typography>
          </Stack>

          {pageStatus === "loading" && (
            <Stack spacing={2}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rounded" height={200} />
              ))}
            </Stack>
          )}

          {pageStatus === "error" && (
            <Alert severity="error">
              {error || t("associations.errors.loadFailed")}
            </Alert>
          )}

          {pageStatus === "ready" && (
            <>
              {elements.length === 0 && (
                <Alert severity="info">
                  {t("associations.noElements")}
                </Alert>
              )}

              {elements.length > 0 && (
                <Stack spacing={4}>
                  {elements.map((symbol) => {
                    const assoc = associationMap[symbol.id];
                    const form = formState[symbol.id];
                    const isSaving = savingId === symbol.id;

                    return (
                      <Box key={symbol.id}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: "var(--color-text-primary, #e2e8f0)",
                            fontWeight: 500,
                            mb: 1.5,
                          }}
                        >
                          {symbol.data.label}
                        </Typography>

                        {assoc ? (
                          <AssociationCard
                            association={assoc}
                            elementLabel={symbol.data.label}
                            onEdit={(id, patch) =>
                              handleEdit(symbol.id, id, patch)
                            }
                            onDelete={(id) => handleDelete(symbol.id, id)}
                          />
                        ) : (
                          <Stack spacing={2}>
                            <TextField
                              multiline
                              minRows={3}
                              placeholder={t("associations.associationPlaceholder")}
                              label={t("associations.associationLabel")}
                              value={form?.text || ""}
                              onChange={(e) =>
                                setFormState((prev) => ({
                                  ...prev,
                                  [symbol.id]: {
                                    ...prev[symbol.id],
                                    text: e.target.value,
                                  },
                                }))
                              }
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  color: "var(--color-text-primary, #e2e8f0)",
                                  borderColor: "rgba(0, 212, 255, 0.12)",
                                  "& fieldset": {
                                    borderColor: "rgba(0, 212, 255, 0.12)",
                                  },
                                  "&:hover fieldset": {
                                    borderColor: "rgba(0, 212, 255, 0.3)",
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  color: "var(--color-text-secondary, #94a3b8)",
                                },
                              }}
                            />

                            <Box>
                              <Typography
                                variant="caption"
                                sx={{ color: "var(--color-text-muted, #64748b)", display: "block", mb: 0.75 }}
                              >
                                {t("associations.emotionalTone")}
                              </Typography>
                              <ToggleButtonGroup
                                exclusive
                                value={form?.valence || "mixed"}
                                onChange={(_, newVal) => {
                                  if (newVal) {
                                    setFormState((prev) => ({
                                      ...prev,
                                      [symbol.id]: {
                                        ...prev[symbol.id],
                                        valence: newVal as EmotionalValence,
                                      },
                                    }));
                                  }
                                }}
                                fullWidth
                              >
                                {(["positive", "mixed", "negative"] as const).map((val) => (
                                  <ToggleButton
                                    key={val}
                                    value={val}
                                    sx={{
                                      fontSize: "12px",
                                      textTransform: "none",
                                      borderColor: "rgba(0, 212, 255, 0.2)",
                                      "&.Mui-selected": {
                                        backgroundColor: "rgba(0, 212, 255, 0.1)",
                                        borderColor: "rgba(0, 212, 255, 0.3)",
                                      },
                                    }}
                                  >
                                    {t(`associations.valence.${val}`)}
                                  </ToggleButton>
                                ))}
                              </ToggleButtonGroup>
                            </Box>

                            <SalienceInput
                              value={form?.salience || 3}
                              onChange={(val) =>
                                setFormState((prev) => ({
                                  ...prev,
                                  [symbol.id]: {
                                    ...prev[symbol.id],
                                    salience: val,
                                  },
                                }))
                              }
                            />

                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleCreate(symbol.id)}
                              disabled={isSaving || !form?.text.trim()}
                              startIcon={isSaving ? <CircularProgress size={16} /> : undefined}
                            >
                              {isSaving ? t("associations.saving") : t("associations.saveAssociation")}
                            </Button>
                          </Stack>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              )}

              {elements.length > 0 && (
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
                      {t("associations.continueHint")}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => onContinue?.(dreamId)}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      {t("associations.continueButton")}
                    </Button>
                  </Stack>
                </>
              )}

              {error && (
                <Alert severity="warning">{error}</Alert>
              )}
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
