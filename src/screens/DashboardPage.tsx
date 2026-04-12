import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import DreamListItem from "../entities/dream/ui";
import { subscribeDreams } from "../services/firestore/firestoreRepo";
import { getDb, ensureAnonymousAuth } from "../app/config/firebase";
import type { DreamDoc, DreamId } from "../shared/types/domain";

type DashboardPageProps = {
  onDreamSelect?: (dreamId: DreamId) => void;
};

export default function DashboardPage({ onDreamSelect }: DashboardPageProps) {
  const [dreams, setDreams] = useState<Array<{ id: DreamId; data: DreamDoc }>>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      try {
        const user = await ensureAnonymousAuth();

        const db = getDb();
        unsubscribe = subscribeDreams(db, user.uid, (dreamList) => {
          setDreams(dreamList);
          setLoading(false);
        });
      } catch (error) {
        console.error("Failed to initialize dashboard:", error);
        setLoading(false);
      }
    }

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleRecordDream = () => {
    navigate("/dreams/new");
  };

  const handleDreamClick = (dreamId: DreamId) => {
    onDreamSelect?.(dreamId);
    navigate(`/dreams/${dreamId}`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-bg-primary, #080c14)",
        }}
      >
        <CircularProgress sx={{ color: "#00d4ff" }} />
      </Box>
    );
  }

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
          <Stack spacing={2}>
            <Typography
              variant="overline"
              sx={{ color: "var(--color-text-muted, #64748b)" }}
            >
              Dream Journal
            </Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography
                variant="h4"
                component="h1"
                sx={{ color: "var(--color-text-primary, #e2e8f0)", fontWeight: 700 }}
              >
                Dream History
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleRecordDream}
              >
                Record a Dream
              </Button>
            </Stack>
          </Stack>

          {/* Dream List or Empty State */}
          {dreams.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 10,
                border: "1px solid rgba(0, 212, 255, 0.08)",
                borderRadius: "12px",
                backgroundColor: "rgba(15, 22, 41, 0.5)",
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "var(--color-text-secondary, #94a3b8)", mb: 1.5, fontWeight: 500 }}
              >
                No dreams yet
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "var(--color-text-muted, #64748b)", mb: 4, maxWidth: 360, mx: "auto" }}
              >
                Start your dreamwork journey by recording your first dream
              </Typography>
              <Button variant="outlined" color="primary" onClick={handleRecordDream}>
                Get Started
              </Button>
            </Box>
          ) : (
            <Stack spacing={0}>
              {dreams.map((dream) => (
                <DreamListItem
                  key={dream.id}
                  dream={dream}
                  onClick={handleDreamClick}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
