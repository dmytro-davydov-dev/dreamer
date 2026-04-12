import { Box, Card, CardActionArea, Stack, Typography } from "@mui/material";
import StatusBadge from "../../../shared/ui/StatusBadge";
import type { DreamDoc, DreamId } from "../model/types";

interface DreamListItemProps {
  dream: { id: DreamId; data: DreamDoc };
  onClick: (dreamId: DreamId) => void;
}

const MAX_EXCERPT_LENGTH = 120;

function formatDreamDate(timestamp: { toDate: () => Date }): string {
  const date = timestamp.toDate();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export default function DreamListItem({ dream, onClick }: DreamListItemProps) {
  const { id, data } = dream;
  const excerpt = truncateText(data.rawText, MAX_EXCERPT_LENGTH);
  const dateStr = formatDreamDate(data.dreamedAt);

  return (
    <Card
      sx={{
        mb: 2,
        border: "1px solid rgba(0, 212, 255, 0.1)",
        boxShadow: "none",
        backgroundColor: "rgba(15, 22, 41, 0.8)",
        backdropFilter: "blur(8px)",
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: "rgba(0, 212, 255, 0.28)",
          boxShadow: "0 8px 32px rgba(0, 212, 255, 0.08)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardActionArea onClick={() => onClick(id)}>
        <Box sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography
                variant="caption"
                sx={{ color: "var(--color-text-muted, #64748b)" }}
              >
                {dateStr}
              </Typography>
              <StatusBadge status={data.status} />
            </Stack>

            <Typography
              variant="body1"
              sx={{
                color: "var(--color-text-primary, #e2e8f0)",
                lineHeight: "1.625",
              }}
            >
              {excerpt}
            </Typography>

            {data.mood && (
              <Typography
                variant="caption"
                sx={{
                  color: "var(--color-text-muted, #64748b)",
                  fontStyle: "italic",
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                mood: {data.mood}
              </Typography>
            )}
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  );
}
