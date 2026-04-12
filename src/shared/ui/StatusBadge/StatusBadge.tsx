import { Chip } from "@mui/material";
import type { DreamStatus } from "../../types/domain";

interface StatusBadgeProps {
  status: DreamStatus;
}

const statusLabels: Record<DreamStatus, string> = {
  draft: "Draft",
  structured: "Structured",
  associated: "Associated",
  interpreted: "Interpreted",
  integrated: "Integrated",
};

const statusStyles: Record<
  DreamStatus,
  { bg: string; color: string; border: string }
> = {
  draft: {
    bg: "rgba(100, 116, 139, 0.12)",
    color: "#94a3b8",
    border: "rgba(100, 116, 139, 0.3)",
  },
  structured: {
    bg: "rgba(0, 212, 255, 0.1)",
    color: "#00d4ff",
    border: "rgba(0, 212, 255, 0.3)",
  },
  associated: {
    bg: "rgba(124, 58, 237, 0.12)",
    color: "#a78bfa",
    border: "rgba(124, 58, 237, 0.35)",
  },
  interpreted: {
    bg: "rgba(245, 158, 11, 0.1)",
    color: "#f59e0b",
    border: "rgba(245, 158, 11, 0.35)",
  },
  integrated: {
    bg: "rgba(16, 185, 129, 0.1)",
    color: "#10b981",
    border: "rgba(16, 185, 129, 0.35)",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status];
  return (
    <Chip
      label={statusLabels[status]}
      size="small"
      sx={{
        height: "22px",
        fontSize: "0.65rem",
        fontWeight: 600,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        letterSpacing: "0.04em",
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        borderRadius: "6px",
        textTransform: "uppercase",
      }}
    />
  );
}
