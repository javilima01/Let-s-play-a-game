'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Button,
  Box,
  Typography,
  ThemeProvider,
  createTheme,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

/* DnD Kit */
import {
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

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
  deleteAdminGame,    // new import
  setRotatingMessages
} from '@/services/admin';
import {
  getRotatingMessages
} from '@/services/endpoints';
import { csvToOpponents, opponentsToCsv } from '@/services/utils';

/* Components */
import MetaForm from '@/components/MetaForm';
import StepsPanel from '@/components/StepsPanel';

/* Theme & CSS */
import dash from '@/css/AdminDashboard.module.css';

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
          height: '100%'
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

export default function AdminDashboard() {
  /* STATE */
  const [games, setGames] = useState([]);
  const [selected, setSelected] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ title: '', description: '', opponents: '' });
  const [savingMeta, setSavingMeta] = useState(false);
  // ─── ROTATING MESSAGE EDITOR STATE ───────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMessages, setEditMessages] = useState([]);

  // load existing messages when dialog opens
  const openEditor = async () => {
    const msgs = await getRotatingMessages();
    setEditMessages(msgs);
    setDialogOpen(true);
  };

  const saveMessages = async () => {
    await setRotatingMessages(editMessages);
    setDialogOpen(false);
  };
  // ─────────────────────────────────────────────────────────
  /* Stable DnD sensors */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  /* FETCH GAMES */
  useEffect(() => {
    (async () => setGames(await getAdminGames()))();
  }, []);

  /* OPEN GAME */
  const openGame = useCallback(async game => {
    setSelected(game);
    setMeta({
      title: game.title || '',
      description: game.description || '',
      opponents: opponentsToCsv(game.opponents || []),
    });
    setLoading(true);
    const st = await getAdminSteps(game.gameId);
    st.sort((a, b) => a.step - b.step);
    setSteps(st);
    setLoading(false);
  }, []);

  /* SAVE META */
  const saveMeta = useCallback(async () => {
    setSavingMeta(true);
    const payload = {
      title: meta.title,
      description: meta.description,
      opponents: csvToOpponents(meta.opponents),
      password: meta.password
    };
    await updateAdminGameMeta(selected.gameId, payload);
    setGames(g => g.map(x => x.gameId === selected.gameId ? { ...x, ...payload } : x));
    setSelected(s => ({ ...s, ...payload }));
    setSavingMeta(false);
  }, [meta, selected]);

  /* DRAG END */
  const handleDragEnd = useCallback(async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = steps.findIndex(s => s.stepId === active.id);
    const newIndex = steps.findIndex(s => s.stepId === over.id);
    const reordered = arrayMove(steps, oldIndex, newIndex)
      .map((s, i) => ({ ...s, step: i }));
    setSteps(reordered);
    await updateAdminStepOrder(
      selected.gameId,
      reordered.map(({ stepId, step }) => ({ stepId, step }))
    );
  }, [steps, selected]);

  /* CREATE STEP */
  const handleCreateStep = useCallback(async payload => {
    const created = await createAdminStep(
      selected.gameId,
      { ...payload, stepId: uuidv4(), step: steps.length }
    );
    setSteps(s => [...s, created]);
  }, [selected, steps.length]);

  /* UPDATE STEP */
  const handleUpdate = useCallback(async (stepId, patch) => {
    setSteps(s => s.map(x => x.stepId === stepId ? { ...x, ...patch } : x));
    await patchAdminStep(stepId, patch);
  }, []);

  /* DELETE STEP */
  const handleDelete = useCallback(async stepId => {
    if (!window.confirm('Delete this step?')) return;
    await deleteAdminStep(stepId);
    setSteps(s => s.filter(x => x.stepId !== stepId));
  }, []);

  /* DELETE GAME */
  const handleDeleteGame = useCallback(async () => {
    if (!window.confirm('Delete this game?')) return;
    await deleteAdminGame(selected.gameId);
    setGames(g => g.filter(x => x.gameId !== selected.gameId));
    setSelected(null);
  }, [selected, setGames]);

  const [publicOrigin, setPublicOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // remove any trailing /admin from the origin
      setPublicOrigin(window.location.origin.replace(/\/admin\/?$/, ''));
    }
  }, []);

  /* LANDING */
  if (!selected) {
    return (
      <ThemeProvider theme={glassTheme}>
        <Box className={`${dash.notSelected} min-h-screen flex flex-col items-center justify-center p-8`}>
          <Paper className={`${dash.cardGlass} w-full max-w-md p-6 space-y-4`}>
            <Typography variant="h5" textAlign="center" fontWeight={700}>
              Select a game
            </Typography>

            <ul className={dash.gamesList}>
              {games.map(g => (
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
                setGames(arr => [...arr, g]);
                openGame(g);
              }}
              sx={{ background: 'var(--primary)', '&:hover': { background: 'var(--primary-light)' } }}
            >
              + New game
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={openEditor}
              sx={{ mt: 1 }}
            >
              Modify messages
            </Button>
            {/* ─── Messages Editor Dialog ─────────────────── */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
              <DialogTitle>Edit rotating messages</DialogTitle>
              <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {editMessages.map((m, i) => (
                  <TextField
                    key={i}
                    label={`Message #${i + 1}`}
                    value={m}
                    fullWidth
                    onChange={e => {
                      const arr = [...editMessages];
                      arr[i] = e.target.value;
                      setEditMessages(arr);
                    }}
                  />
                ))}
                <Button
                  variant="text"
                  onClick={() => setEditMessages([...editMessages, ""])}
                >
                  + Add another
                </Button>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={saveMessages}>Save</Button>
              </DialogActions>
            </Dialog>
            {/* ──────────────────────────────────────────────── */}
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  /* EDITOR */
  return (
    <ThemeProvider theme={glassTheme}>
      <Box
        className={dash.page}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          pt: '64px',                              // push below your 64px TopBar
          height: 'calc(100vh - 64px)',            // fill remaining viewport
          width: '100vw',
          alignItems: 'flex-start',
        }}
      >
        <MetaForm
          meta={meta}
          setMeta={setMeta}
          savingMeta={savingMeta}
          onSave={saveMeta}
          onBack={() => setSelected(null)}
        >
          {/* Show Game ID and Delete button */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
            flexDirection="column"
            rowGap="1em"
          >
            <Button
              component="a"
              href={`${publicOrigin}/g/${selected.gameId}`}
              variant="contained"
              color="primary"
              fullWidth
            >
              Play Game
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteGame}
              fullWidth
            >
              Delete Game
            </Button>
          </Box>

          <StepsPanel
            steps={steps}
            loading={loading}
            sensors={sensors}
            handleDragEnd={handleDragEnd}
            handleCreateStep={handleCreateStep}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </MetaForm>
      </Box>
    </ThemeProvider>
  );
}