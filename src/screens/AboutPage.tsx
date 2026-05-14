import { Box, Button, Divider, Typography } from "@mui/material";
import { useNavigate } from "react-router";

const section = {
  mb: 4,
};

const heading = {
  color: "var(--color-text-primary, #e2e8f0)",
  fontWeight: 600,
  mb: 1.5,
};

const body = {
  color: "var(--color-text-secondary, #94a3b8)",
  lineHeight: 1.8,
  mb: 1.5,
};

const accent = {
  color: "var(--color-accent-primary, #00d4ff)",
  fontWeight: 600,
};

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: "auto",
        px: { xs: 3, sm: 4 },
        py: 5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="h4" sx={heading}>
          Dreamer
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/dashboard")}
          sx={{
            background: "linear-gradient(135deg, #00d4ff 0%, #0099bb 100%)",
            color: "#080c14",
            fontWeight: 700,
            letterSpacing: "0.04em",
            px: 3,
            py: 1,
            borderRadius: "8px",
            textTransform: "none",
            "&:hover": {
              background: "linear-gradient(135deg, #33ddff 0%, #00bbdd 100%)",
            },
          }}
        >
          Start →
        </Button>
      </Box>
      <Typography variant="body2" sx={{ color: "var(--color-text-secondary, #94a3b8)", mb: 4 }}>
        A tool for Jungian dreamwork and inner reflection
      </Typography>

      <Divider sx={{ borderColor: "rgba(0, 212, 255, 0.1)", mb: 4 }} />

      {/* Jung section */}
      <Box sx={section}>
        <Typography variant="h6" sx={heading}>
          What is Jungian Dreamwork?
        </Typography>
        <Typography variant="body1" sx={body}>
          Carl Jung believed that dreams are not random noise, but meaningful communications from
          the unconscious psyche. Where Freud focused on repressed wishes, Jung saw dreams as
          compensatory messages — the unconscious showing us what our waking mind overlooks,
          neglects, or cannot yet integrate.
        </Typography>
        <Typography variant="body1" sx={body}>
          Central to Jung's framework are a few core ideas. The{" "}
          <Box component="span" sx={accent}>shadow</Box> holds qualities we deny in ourselves — both
          dark and light. The{" "}
          <Box component="span" sx={accent}>anima / animus</Box> represents the contrasexual inner
          figure that mediates between the ego and the deeper unconscious. The{" "}
          <Box component="span" sx={accent}>Self</Box> is the organising centre of the whole psyche,
          often appearing in dreams as a figure of authority, a wise elder, or a numinous symbol.
          Through dreamwork, we begin to recognise these figures not as strangers, but as parts of
          ourselves seeking acknowledgement.
        </Typography>
        <Typography variant="body1" sx={body}>
          Jung's method of{" "}
          <Box component="span" sx={accent}>amplification</Box> asks the dreamer to circle a symbol
          outward — associating it with personal memories, cultural parallels, and archetypal themes —
          rather than reducing it to a single fixed meaning. The goal is not a definitive answer but
          a richer dialogue with the unconscious.
        </Typography>
      </Box>

      {/* Inner Work section */}
      <Box sx={section}>
        <Typography variant="h6" sx={heading}>
          Robert A. Johnson's <em>Inner Work</em>
        </Typography>
        <Typography variant="body1" sx={body}>
          Analyst Robert A. Johnson distilled Jung's approach into a four-step practice in his book{" "}
          <em>Inner Work</em>. First, gather your{" "}
          <Box component="span" sx={accent}>associations</Box> — what does each image bring to mind
          from your own life? Second,{" "}
          <Box component="span" sx={accent}>connect the dream to your inner life</Box> — treat every
          figure as an aspect of your own psyche rather than as a commentary on other people.
          Third, interpret — form tentative{" "}
          <Box component="span" sx={accent}>hypotheses</Box> and hold them lightly. Fourth, make the
          insight{" "}
          <Box component="span" sx={accent}>concrete</Box> through a small ritual or lived act that
          honours what the dream asked of you.
        </Typography>
        <Typography variant="body1" sx={body}>
          Johnson insists that interpretations are always provisional. No symbol has a fixed
          universal meaning. The dreamer's own associations come first, and the most valuable
          dreamwork ends not in a clever reading but in a modest, embodied change.
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(0, 212, 255, 0.1)", mb: 4 }} />

      {/* How the app implements it */}
      <Box sx={section}>
        <Typography variant="h6" sx={heading}>
          How This App Works
        </Typography>
        <Typography variant="body1" sx={body}>
          Dreamer walks you through Johnson's four steps as a structured session:
        </Typography>

        <Box
          component="ol"
          sx={{ pl: 2.5, color: "var(--color-text-secondary, #94a3b8)", lineHeight: 1.9 }}
        >
          {[
            [
              "Record",
              "Write your dream in free text. The app parses it into characters, symbols, settings, emotions, and narrative shifts so nothing gets lost.",
            ],
            [
              "Associate",
              "For each element, you supply your own personal associations. The app never overrides these with dictionary definitions.",
            ],
            [
              "Interpret",
              "Using your dream and associations, the AI generates several clearly labelled hypotheses — compensation, shadow, anima/animus, archetypal, and individuation. Each is a question to sit with, not a verdict.",
            ],
            [
              "Integrate",
              "The app suggests a small, concrete act to bring the dream's insight into waking life — in the spirit of Johnson's ritual step.",
            ],
          ].map(([title, text]) => (
            <Box component="li" key={title} sx={{ mb: 1.5 }}>
              <Box component="span" sx={accent}>
                {title}
              </Box>
              {" — "}
              {text}
            </Box>
          ))}
        </Box>

        <Typography variant="body1" sx={{ ...body, mt: 2 }}>
          All interpretations are framed as hypotheses. Your associations take precedence over any
          AI suggestion. The app is designed for personal reflection — it makes no diagnostic
          or therapeutic claims, and your data stays private.
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(0, 212, 255, 0.1)", mb: 3 }} />

      <Typography variant="body2" sx={{ color: "rgba(148, 163, 184, 0.5)", fontSize: "0.8rem" }}>
        This project is intended for personal reflection and educational exploration. It is not a
        substitute for psychotherapy or professional mental health care.
      </Typography>
    </Box>
  );
}
