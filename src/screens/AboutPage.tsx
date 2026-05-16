import { Box, Button, Divider, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { useTranslation, Trans } from "react-i18next";

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
  const { t } = useTranslation();

  const steps = [
    { titleKey: "about.howItWorks.steps.record.title", descKey: "about.howItWorks.steps.record.description" },
    { titleKey: "about.howItWorks.steps.associate.title", descKey: "about.howItWorks.steps.associate.description" },
    { titleKey: "about.howItWorks.steps.interpret.title", descKey: "about.howItWorks.steps.interpret.description" },
    { titleKey: "about.howItWorks.steps.integrate.title", descKey: "about.howItWorks.steps.integrate.description" },
  ];

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
          {t("about.title")}
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
          {t("about.start")}
        </Button>
      </Box>
      <Typography variant="body2" sx={{ color: "var(--color-text-secondary, #94a3b8)", mb: 4 }}>
        {t("about.subtitle")}
      </Typography>

      <Divider sx={{ borderColor: "rgba(0, 212, 255, 0.1)", mb: 4 }} />

      {/* Jung section */}
      <Box sx={section}>
        <Typography variant="h6" sx={heading}>
          {t("about.jung.heading")}
        </Typography>
        <Typography variant="body1" sx={body}>
          {t("about.jung.p1")}
        </Typography>
        <Typography variant="body1" sx={body}>
          <Trans
            i18nKey="about.jung.p2"
            components={{ accent: <Box component="span" sx={accent} /> }}
          />
        </Typography>
        <Typography variant="body1" sx={body}>
          <Trans
            i18nKey="about.jung.p3"
            components={{ accent: <Box component="span" sx={accent} /> }}
          />
        </Typography>
      </Box>

      {/* Inner Work section */}
      <Box sx={section}>
        <Typography variant="h6" sx={heading}>
          <Trans i18nKey="about.innerWork.heading" components={{ em: <em /> }} />
        </Typography>
        <Typography variant="body1" sx={body}>
          <Trans
            i18nKey="about.innerWork.p1"
            components={{ em: <em />, accent: <Box component="span" sx={accent} /> }}
          />
        </Typography>
        <Typography variant="body1" sx={body}>
          {t("about.innerWork.p2")}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(0, 212, 255, 0.1)", mb: 4 }} />

      {/* How the app implements it */}
      <Box sx={section}>
        <Typography variant="h6" sx={heading}>
          {t("about.howItWorks.heading")}
        </Typography>
        <Typography variant="body1" sx={body}>
          {t("about.howItWorks.intro")}
        </Typography>

        <Box
          component="ol"
          sx={{ pl: 2.5, color: "var(--color-text-secondary, #94a3b8)", lineHeight: 1.9 }}
        >
          {steps.map(({ titleKey, descKey }) => (
            <Box component="li" key={titleKey} sx={{ mb: 1.5 }}>
              <Box component="span" sx={accent}>
                {t(titleKey)}
              </Box>
              {" — "}
              {t(descKey)}
            </Box>
          ))}
        </Box>

        <Typography variant="body1" sx={{ ...body, mt: 2 }}>
          {t("about.howItWorks.footnote")}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(0, 212, 255, 0.1)", mb: 3 }} />

      <Typography variant="body2" sx={{ color: "rgba(148, 163, 184, 0.5)", fontSize: "0.8rem" }}>
        {t("about.disclaimer")}
      </Typography>
    </Box>
  );
}
