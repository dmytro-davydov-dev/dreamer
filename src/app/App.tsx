import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate, useParams } from "react-router";
import type { Firestore } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import DashboardPage from "../screens/DashboardPage";
import LoginPage from "../screens/LoginPage";
import DreamEntryPage from "../features/dreamCapture/ui/DreamEntryPage";
import DreamIntegrationPage from "../features/dreamIntegration/ui/DreamIntegrationPage";
import DreamBreakdownPage from "../features/dreamStructuring/ui/DreamBreakdownPage";
import AssociationsPage from "../features/dreamAssociations/ui/AssociationsPage";
import InterpretationPage from "../features/dreamInterpretation/ui/InterpretationPage";
import SettingsPage from "../features/byok/ui/SettingsPage";
import AboutPage from "../screens/AboutPage";
import { ensureAnonymousAuth, getAuthService, getDb, signOutUser } from "./config/firebase";
import type { DreamId, UID } from "../shared/types/domain";

type NavItem = {
  label: string;
  path: string;
  requiresActiveDream?: boolean;
};

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <Box
      sx={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        textAlign: "center",
        color: "var(--color-text-secondary, #94a3b8)",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          color: "var(--color-text-primary, #e2e8f0)",
          mb: 1,
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>
      <Typography variant="body1" sx={{ maxWidth: 520, color: "var(--color-text-secondary, #94a3b8)" }}>
        {description}
      </Typography>
    </Box>
  );
}


function DreamEntryScreen({ onDreamSelect }: { onDreamSelect: (dreamId: DreamId) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState<{
    status: "loading" | "ready" | "error";
    db: Firestore | null;
    uid: UID | null;
  }>({ status: "loading", db: null, uid: null });

  useEffect(() => {
    let isActive = true;

    async function init() {
      try {
        const user = await ensureAnonymousAuth();
        if (!isActive) return;
        setState({ status: "ready", db: getDb(), uid: user.uid as UID });
      } catch (error) {
        console.error("Failed to initialize dream entry:", error);
        if (!isActive) return;
        setState({ status: "error", db: null, uid: null });
      }
    }

    init();

    return () => {
      isActive = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (state.status === "error" || !state.db || !state.uid) {
    return (
      <PlaceholderPage
        title={t("placeholders.dreamEntry.title")}
        description={t("placeholders.dreamEntry.description")}
      />
    );
  }

  return (
    <DreamEntryPage
      db={state.db}
      uid={state.uid}
      onContinue={(dreamId: DreamId) => {
        onDreamSelect(dreamId);
        navigate(`/dreams/${dreamId}/breakdown`);
      }}
    />
  );
}

function DreamSessionRoute({ onDreamSelect }: { onDreamSelect: (dreamId: DreamId) => void }) {
  const { t } = useTranslation();
  const { dreamId } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState<{
    status: "loading" | "ready" | "error";
    db: Firestore | null;
    uid: UID | null;
  }>({ status: "loading", db: null, uid: null });

  useEffect(() => {
    if (dreamId) onDreamSelect(dreamId as DreamId);
  }, [dreamId, onDreamSelect]);

  useEffect(() => {
    let isActive = true;

    async function init() {
      try {
        const user = await ensureAnonymousAuth();
        if (!isActive) return;
        setState({ status: "ready", db: getDb(), uid: user.uid as UID });
      } catch {
        if (!isActive) return;
        setState({ status: "error", db: null, uid: null });
      }
    }

    init();
    return () => { isActive = false; };
  }, []);

  if (state.status === "loading") {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (state.status === "error" || !state.db || !state.uid || !dreamId) {
    return (
      <PlaceholderPage
        title={t("placeholders.dreamSession.title")}
        description={t("placeholders.dreamSession.description")}
      />
    );
  }

  return (
    <DreamBreakdownPage
      db={state.db}
      uid={state.uid}
      dreamId={dreamId as DreamId}
      onContinue={(id: DreamId) => {
        navigate(`/dreams/${id}/associations`);
      }}
    />
  );
}

function DreamIntegrationRoute({ onDreamSelect }: { onDreamSelect: (dreamId: DreamId) => void }) {
  const { dreamId } = useParams();

  useEffect(() => {
    if (dreamId) onDreamSelect(dreamId as DreamId);
  }, [dreamId, onDreamSelect]);

  return <DreamIntegrationPage dreamId={dreamId as DreamId | undefined} />;
}

/** Reusable loader that initialises Firebase + renders DreamBreakdownPage */
function DreamBreakdownLoader({
  dreamId,
  onContinue,
}: {
  dreamId: DreamId;
  onContinue?: (id: DreamId) => void;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<{
    status: "loading" | "ready" | "error";
    db: Firestore | null;
    uid: UID | null;
  }>({ status: "loading", db: null, uid: null });

  useEffect(() => {
    let isActive = true;

    async function init() {
      try {
        const user = await ensureAnonymousAuth();
        if (!isActive) return;
        setState({ status: "ready", db: getDb(), uid: user.uid as UID });
      } catch {
        if (!isActive) return;
        setState({ status: "error", db: null, uid: null });
      }
    }

    init();
    return () => { isActive = false; };
  }, []);

  if (state.status === "loading") {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (state.status === "error" || !state.db || !state.uid) {
    return (
      <PlaceholderPage
        title={t("placeholders.dreamBreakdown.title")}
        description={t("placeholders.dreamBreakdown.loadFailed")}
      />
    );
  }

  return (
    <DreamBreakdownPage
      db={state.db}
      uid={state.uid}
      dreamId={dreamId}
      onContinue={onContinue}
    />
  );
}

function DreamBreakdownRouteFromActive({
  activeDreamId,
  onDreamSelect,
}: {
  activeDreamId: DreamId;
  onDreamSelect: (id: DreamId) => void;
}) {
  const navigate = useNavigate();
  return (
    <DreamBreakdownLoader
      dreamId={activeDreamId}
      onContinue={(id: DreamId) => {
        onDreamSelect(id);
        navigate(`/dreams/${id}/associations`);
      }}
    />
  );
}

function DreamBreakdownRouteByParam({
  onDreamSelect,
}: {
  onDreamSelect: (id: DreamId) => void;
}) {
  const { t } = useTranslation();
  const { dreamId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (dreamId) onDreamSelect(dreamId as DreamId);
  }, [dreamId, onDreamSelect]);

  if (!dreamId) {
    return (
      <PlaceholderPage
        title={t("placeholders.dreamBreakdown.title")}
        description={t("placeholders.dreamBreakdown.noParam")}
      />
    );
  }

  return (
    <DreamBreakdownLoader
      dreamId={dreamId as DreamId}
      onContinue={(id: DreamId) => {
        onDreamSelect(id);
        navigate(`/dreams/${id}/associations`);
      }}
    />
  );
}

/** Reusable loader for AssociationsPage */
function AssociationsLoader({
  dreamId,
  onContinue,
}: {
  dreamId: DreamId;
  onContinue?: (id: DreamId) => void;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<{
    status: "loading" | "ready" | "error";
    db: Firestore | null;
    uid: UID | null;
  }>({ status: "loading", db: null, uid: null });

  useEffect(() => {
    let isActive = true;

    async function init() {
      try {
        const user = await ensureAnonymousAuth();
        if (!isActive) return;
        setState({ status: "ready", db: getDb(), uid: user.uid as UID });
      } catch {
        if (!isActive) return;
        setState({ status: "error", db: null, uid: null });
      }
    }

    init();
    return () => { isActive = false; };
  }, []);

  if (state.status === "loading") {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (state.status === "error" || !state.db || !state.uid) {
    return (
      <PlaceholderPage
        title={t("placeholders.associations.title")}
        description={t("placeholders.associations.loadFailed")}
      />
    );
  }

  return (
    <AssociationsPage
      db={state.db}
      uid={state.uid}
      dreamId={dreamId}
      onContinue={onContinue}
    />
  );
}

function AssociationsRouteByParam({
  onDreamSelect,
}: {
  onDreamSelect: (id: DreamId) => void;
}) {
  const { t } = useTranslation();
  const { dreamId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (dreamId) onDreamSelect(dreamId as DreamId);
  }, [dreamId, onDreamSelect]);

  if (!dreamId) {
    return (
      <PlaceholderPage
        title={t("placeholders.associations.title")}
        description={t("placeholders.associations.noParam")}
      />
    );
  }

  return (
    <AssociationsLoader
      dreamId={dreamId as DreamId}
      onContinue={(id: DreamId) => {
        onDreamSelect(id);
        navigate(`/dreams/${id}/interpretation`);
      }}
    />
  );
}

/** Reusable loader for InterpretationPage */
function InterpretationLoader({
  dreamId,
  onContinue,
}: {
  dreamId: DreamId;
  onContinue?: (id: DreamId) => void;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<{
    status: "loading" | "ready" | "error";
    db: Firestore | null;
    uid: UID | null;
  }>({ status: "loading", db: null, uid: null });

  useEffect(() => {
    let isActive = true;

    async function init() {
      try {
        const user = await ensureAnonymousAuth();
        if (!isActive) return;
        setState({ status: "ready", db: getDb(), uid: user.uid as UID });
      } catch {
        if (!isActive) return;
        setState({ status: "error", db: null, uid: null });
      }
    }

    init();
    return () => { isActive = false; };
  }, []);

  if (state.status === "loading") {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (state.status === "error" || !state.db || !state.uid) {
    return (
      <PlaceholderPage
        title={t("placeholders.interpretation.title")}
        description={t("placeholders.interpretation.loadFailed")}
      />
    );
  }

  return (
    <InterpretationPage
      db={state.db}
      uid={state.uid}
      dreamId={dreamId}
      onContinue={onContinue}
    />
  );
}

function InterpretationRouteByParam({
  onDreamSelect,
}: {
  onDreamSelect: (id: DreamId) => void;
}) {
  const { t } = useTranslation();
  const { dreamId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (dreamId) onDreamSelect(dreamId as DreamId);
  }, [dreamId, onDreamSelect]);

  if (!dreamId) {
    return (
      <PlaceholderPage
        title={t("placeholders.interpretation.title")}
        description={t("placeholders.interpretation.noParam")}
      />
    );
  }

  return (
    <InterpretationLoader
      dreamId={dreamId as DreamId}
      onContinue={(id: DreamId) => {
        onDreamSelect(id);
        navigate(`/dreams/${id}/integration`);
      }}
    />
  );
}

function AppShell() {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDreamId, setActiveDreamId] = useState<DreamId | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuthService();
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return unsub;
  }, []);

  async function handleSignOut() {
    await signOutUser();
    navigate("/login");
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("dreamer.activeDreamId");
    if (stored) setActiveDreamId(stored as DreamId);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeDreamId) {
      window.localStorage.setItem("dreamer.activeDreamId", activeDreamId);
    } else {
      window.localStorage.removeItem("dreamer.activeDreamId");
    }
  }, [activeDreamId]);

  const handleDreamSelect = useCallback((dreamId: DreamId) => {
    setActiveDreamId(dreamId);
  }, []);

  const navItems = useMemo<NavItem[]>(
    () => [
      { label: t("nav.dashboard"), path: "/dashboard" },
      { label: t("nav.recordDream"), path: "/dreams/new" },
      {
        label: t("nav.dreamBreakdown"),
        path: activeDreamId ? `/dreams/${activeDreamId}/breakdown` : "/dreams/breakdown",
      },
      { label: t("nav.associations"), path: "/dreams/associations" },
      { label: t("nav.interpretation"), path: "/dreams/interpretation" },
      {
        label: t("nav.integration"),
        path: activeDreamId ? `/dreams/${activeDreamId}/integration` : "/dreams/integration",
      },
      { label: t("nav.settings"), path: "/settings" },
      { label: t("nav.about"), path: "/about" },
    ],
    [activeDreamId, t]
  );

  const visibleNavItems = navItems.filter(
    (item) => !item.requiresActiveDream || Boolean(activeDreamId)
  );

  const handleCloseDrawer = () => setDrawerOpen(false);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "var(--color-bg-primary, #080c14)" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: "rgba(8, 12, 20, 0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0, 212, 255, 0.12)",
          color: "var(--color-text-primary, #e2e8f0)",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label={t("nav.openMenu")}
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2, "&:hover": { backgroundColor: "rgba(0, 212, 255, 0.08)" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: "0.04em",
              background: "linear-gradient(135deg, #e2e8f0 30%, #00d4ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {t("appName")}
          </Typography>

          {/* User info + auth button */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {currentUser !== undefined && (
              <Tooltip
                title={currentUser?.isAnonymous ? t("auth.guestSession") : (currentUser?.email ?? "")}
                placement="bottom-end"
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: currentUser?.isAnonymous
                      ? "var(--color-text-secondary, #94a3b8)"
                      : "var(--color-accent-primary, #00d4ff)",
                    fontSize: "0.8rem",
                    maxWidth: 180,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentUser?.isAnonymous || !currentUser
                    ? t("auth.anonymous")
                    : currentUser.email}
                </Typography>
              </Tooltip>
            )}
            {currentUser !== undefined && (
              currentUser ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSignOut}
                  sx={{
                    borderColor: "rgba(0, 212, 255, 0.3)",
                    color: "var(--color-text-secondary, #94a3b8)",
                    textTransform: "none",
                    fontSize: "0.8rem",
                    px: 1.5,
                    py: 0.5,
                    "&:hover": {
                      borderColor: "rgba(0, 212, 255, 0.6)",
                      color: "var(--color-text-primary, #e2e8f0)",
                      backgroundColor: "rgba(0, 212, 255, 0.06)",
                    },
                  }}
                >
                  {t("auth.signOut")}
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate("/login")}
                  sx={{
                    borderColor: "rgba(0, 212, 255, 0.3)",
                    color: "var(--color-accent-primary, #00d4ff)",
                    textTransform: "none",
                    fontSize: "0.8rem",
                    px: 1.5,
                    py: 0.5,
                    "&:hover": {
                      borderColor: "rgba(0, 212, 255, 0.6)",
                      backgroundColor: "rgba(0, 212, 255, 0.06)",
                    },
                  }}
                >
                  {t("auth.signIn")}
                </Button>
              )
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: "#0f1629",
            borderRight: "1px solid rgba(0, 212, 255, 0.1)",
            color: "var(--color-text-primary, #e2e8f0)",
          },
        }}
      >
        <Box component="nav" aria-label="Primary navigation" sx={{ mt: 1, px: 1 }}>
          <List>
            {visibleNavItems.map((item) => (
              <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  onClick={handleCloseDrawer}
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderRadius: "8px",
                    color: "var(--color-text-secondary, #94a3b8)",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(0, 212, 255, 0.06)",
                      color: "var(--color-text-primary, #e2e8f0)",
                    },
                    "&.active": {
                      backgroundColor: "rgba(0, 212, 255, 0.08)",
                      color: "var(--color-accent-primary, #00d4ff)",
                      borderLeft: "2px solid #00d4ff",
                    },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 500 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ borderColor: "rgba(0, 212, 255, 0.1)", mt: 1 }} />
        </Box>
      </Drawer>

      <Toolbar />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<DashboardPage onDreamSelect={handleDreamSelect} />} />
        <Route
          path="/dreams/new"
          element={<DreamEntryScreen onDreamSelect={handleDreamSelect} />}
        />
        <Route
          path="/dreams/:dreamId"
          element={<DreamSessionRoute onDreamSelect={handleDreamSelect} />}
        />
        <Route
          path="/dreams/breakdown"
          element={
            activeDreamId ? (
              <DreamBreakdownRouteFromActive
                activeDreamId={activeDreamId}
                onDreamSelect={handleDreamSelect}
              />
            ) : (
              <PlaceholderPage
                title={t("placeholders.dreamBreakdown.title")}
                description={t("placeholders.dreamBreakdown.recordFirst")}
              />
            )
          }
        />
        <Route
          path="/dreams/associations"
          element={
            activeDreamId ? (
              <AssociationsLoader
                dreamId={activeDreamId}
                onContinue={(id) => {
                  handleDreamSelect(id);
                }}
              />
            ) : (
              <PlaceholderPage
                title={t("placeholders.associations.title")}
                description={t("placeholders.associations.recordFirst")}
              />
            )
          }
        />
        <Route
          path="/dreams/:dreamId/associations"
          element={<AssociationsRouteByParam onDreamSelect={handleDreamSelect} />}
        />
        <Route
          path="/dreams/:dreamId/breakdown"
          element={<DreamBreakdownRouteByParam onDreamSelect={handleDreamSelect} />}
        />
        <Route
          path="/dreams/interpretation"
          element={
            activeDreamId ? (
              <InterpretationLoader
                dreamId={activeDreamId}
                onContinue={(id) => {
                  handleDreamSelect(id);
                }}
              />
            ) : (
              <PlaceholderPage
                title={t("placeholders.interpretation.title")}
                description={t("placeholders.interpretation.recordFirst")}
              />
            )
          }
        />
        <Route
          path="/dreams/:dreamId/interpretation"
          element={<InterpretationRouteByParam onDreamSelect={handleDreamSelect} />}
        />
        <Route path="/dreams/integration" element={<DreamIntegrationPage />} />
        <Route
          path="/dreams/:dreamId/integration"
          element={<DreamIntegrationRoute onDreamSelect={handleDreamSelect} />}
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Box>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  );
}
