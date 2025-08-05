'use client';

/*******************************************************************************************
 * AdminDashboard.jsx – migrated to Material‑UI components + glassy palette
 * -----------------------------------------------------------------------------------------
 * • Replaces shadcn primitives with MUI: Button, TextField, Textarea (multiline TextField),
 *   etc., matching the AddStepForm style.
 * • Keeps existing drag‑and‑drop logic and CSS‑module layout classes (cardGlass, sidebar …).
 * • Local ThemeProvider uses the same glassTheme as AddStepForm for visual consistency.
 *
 * Install once (if you haven’t yet):
 *   npm i @mui/material @emotion/react @emotion/styled
 *******************************************************************************************/

import React, { useEffect, useState, useMemo } from 'react';
import {
  Button,
  TextField,
  Box,
  Typography,
  ThemeProvider,
  createTheme,
  Paper,
} from '@mui/material';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* API services */
import {
  getAdminGames,
  createAdminGame,
  updateAdminGameMeta,
  getAdminSteps,
  createAdminStep,
  updateAdminStepOrder,
  patchAdminStep,
  deleteAdminStep,
} from '@/services/admin';

import StepRow from '@/components/StepRow';
import AddStepForm from '@/components/AddStepForm';

/* utils */
import { csvToOpponents, opponentsToCsv } from '@/services/utils';

/* CSS‑module for layout */
import dash from '@/css/AdminDashboard.module.css';

/* ──────────────────────────────────────────────────────────────
 * Sortable wrapper for each <li>
 * ─────────────────────────────────────────────────────────── */
function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    listStyle: 'none',
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </li>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Glassy dark theme shared with AddStepForm
 * ─────────────────────────────────────────────────────────── */
const glassTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#1e90ff', light: '#5ec1ff' },
    background: { paper: 'rgba(15 23 42 / 0.85)' },
    text: { primary: '#fff' },
  },
  shape: { borderRadius: 20 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid var(--white-trans-strong)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 15px 35px -10px rgba(0 0 0 / 0.55)',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: '#fff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--white-trans)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--primary-light)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--primary)',
          },
        },
      },
    },
  },
});

/* ──────────────────────────────────────────────────────────────
 * Admin dashboard component
 * ─────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  /* state */
  const [games, setGames] = useState([]);
  const [selected, setSelected] = useState(null); // game object | null
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  /* meta form */
  const [meta, setMeta] = useState({ title: '', description: '', opponents: '' });
  const [savingMeta, setSavingMeta] = useState(false);

  /* fetch games on mount */
  useEffect(() => {
    (async () => {
      setGames(await getAdminGames());
    })();
  }, []);

  /* open game */
  const openGame = async (game) => {
    setSelected(game);
    setMeta({
      title: game.title ?? '',
      description: game.description ?? '',
      opponents: opponentsToCsv(game.opponents ?? []),
    });
    setLoading(true);
    const st = await getAdminSteps(game.gameId);
    setSteps(st.sort((a, b) => a.step - b.step));
    setLoading(false);
  };

  /* save meta */
  const saveMeta = async () => {
    setSavingMeta(true);
    const payload = {
      title: meta.title,
      description: meta.description,
      opponents: csvToOpponents(meta.opponents),
    };
    await updateAdminGameMeta(selected.gameId, payload);
    setSelected((g) => ({ ...g, ...payload }));
    setGames((arr) => arr.map((g) => (g.gameId === selected.gameId ? { ...g, ...payload } : g)));
    setSavingMeta(false);
  };

  /* reorder steps */
  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = steps.findIndex((s) => s.stepId === active.id);
    const newIndex = steps.findIndex((s) => s.stepId === over.id);
    const reordered = arrayMove(steps, oldIndex, newIndex).map((s, i) => ({ ...s, step: i }));
    setSteps(reordered);
    await updateAdminStepOrder(
      selected.gameId,
      reordered.map(({ stepId, step }) => ({ stepId, step })),
    );
  };

  /* add step */
  const handleCreateStep = async (payload) => {
    const created = await createAdminStep(selected.gameId, { ...payload, stepId: crypto.randomUUID(), step: steps.length });
    setSteps((s) => [...s, created]);
  };

  /* ────────────────────────────────────────────────────────── */
  /* Landing view */
  if (!selected) {
    return (
      <ThemeProvider theme={glassTheme}>
        <Box className={`${dash.notSelected} min-h-screen flex flex-col items-center justify-center p-8`}>
          <Paper className={`${dash.cardGlass} w-full max-w-md p-6 space-y-4`}>
            <Typography variant="h5" textAlign="center" fontWeight={700}>
              Select a game
            </Typography>

            <ul className={dash.gamesList}>
              {games.map((g) => (
                <li key={g.gameId}>
                  <Button
                    fullWidth
                    variant={selected?.gameId === g.gameId ? 'contained' : 'outlined'}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      ...(selected?.gameId === g.gameId && {
                        background: 'linear-gradient(45deg, var(--primary), var(--primary-light))',
                        boxShadow: '0 4px 12px rgba(30 144 255 / 0.4)',
                      }),
                    }}
                    onClick={() => openGame(g)}
                  >
                    {g.title || g.gameId}
                  </Button>
                </li>
              ))}
            </ul>

            <Button
              fullWidth
              variant="contained"
              onClick={async () => {
                const g = await createAdminGame();
                setGames((arr) => [...arr, g]);
                openGame(g);
              }}
              sx={{ background: 'var(--primary)', '&:hover': { background: 'var(--primary-light)' } }}
            >
              + New game
            </Button>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  /* ────────────────────────────────────────────────────────── */
  /* Editor view */
  return (
    <ThemeProvider theme={glassTheme}>
      <Box className={dash.page}>
        {/* Sidebar */}
        <Paper className={`${dash.cardGlass} ${dash.sidebar}`}>
          <Typography variant="h6" fontWeight={700}>
            Game settings
          </Typography>

          <Box className={dash.fieldGroup}>
            <TextField
              label="Title"
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
              fullWidth
            />
          </Box>

          <Box className={dash.fieldGroup}>
            <TextField
              label="Description"
              multiline
              rows={3}
              value={meta.description}
              onChange={(e) => setMeta({ ...meta, description: e.target.value })}
              fullWidth
            />
          </Box>

          <Box className={dash.fieldGroup}>
            <TextField
              label="Allowed opponents (csv)"
              value={meta.opponents}
              onChange={(e) => setMeta({ ...meta, opponents: e.target.value })}
              fullWidth
            />
          </Box>

          <Box className={dash.saveBar}>
            <Button
              fullWidth
              variant="contained"
              onClick={saveMeta}
              disabled={savingMeta}
              sx={{ background: 'var(--primary)', '&:hover': { background: 'var(--primary-light)' } }}
            >
              {savingMeta ? 'Saving…' : 'Save'}
            </Button>
            <Button fullWidth variant="text" onClick={() => setSelected(null)}>
              ← Back to games
            </Button>
          </Box>
        </Paper>

        {/* Main panel */}
        <Paper className={`${dash.cardGlass} ${dash.mainPanel}`}
          sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <Box className={dash.mainHeader} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography className={dash.sectionTitle}>
              Steps ({steps.length})
            </Typography>
            <Box className={dash.actionBar}>
              <AddStepForm onCreate={handleCreateStep} />
            </Box>
          </Box>

          {loading && <Typography>Loading…</Typography>}

          {!loading && (
            <Box className={dash.stepsWrap}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={steps.map((s) => s.stepId)} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-3">
                    {steps.map((s) => (
                      <SortableItem key={s.stepId} id={s.stepId}>
                        <StepRow
                          step={s}
                          onUpdate={async (patch) => {
                            setSteps((arr) => arr.map((it) => (it.stepId === s.stepId ? { ...it, ...patch } : it)));
                            await patchAdminStep(s.stepId, patch);
                          }}
                          onDelete={async () => {
                            if (!window.confirm('Delete this step?')) return;
                            await deleteAdminStep(s.stepId);
                            setSteps((arr) => arr.filter((it) => it.stepId !== s.stepId));
                          }}
                        />
                      </SortableItem>
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </Box>
          )}
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
