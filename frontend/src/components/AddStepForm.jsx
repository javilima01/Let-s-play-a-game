'use client';

import React, { useState } from 'react';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Box, Typography, RadioGroup, Radio, FormControlLabel
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

/* —— helpers —— */
const FieldBox = ({ children }) => (
  <Box display="flex" flexDirection="column" gap={1} mb={2}>
    {children}
  </Box>
);

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
          boxShadow: '0 15px 35px -10px rgba(0 0 0 / .55)',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: '#fff',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--white-trans)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--primary-light)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--primary)' },
        },
      },
    },
    MuiSelect: { styleOverrides: { icon: { color: '#fff' } } },
    MuiFormLabel: { styleOverrides: { root: { color: 'var(--white-trans)' } } },
  },
});

/* —— main component —— */
export default function AddStepForm({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('question');

  const blankQuestion = {
    question: '',
    timeLimit: 15000,
    messages: { intro: '', correct: '', wrong: '' },
    options: Array.from({ length: 4 }, (_, i) => ({ id: i + 1, text: '', correct: i === 0 })),
  };
  const blankChallenge = { playerId: '', opponentsCsv: '' };

  const [qData, setQ] = useState(blankQuestion);
  const [cData, setC] = useState(blankChallenge);

  const reset = () => {
    setType('question');
    setQ(blankQuestion);
    setC(blankChallenge);
  };

  /* convert CSV → [{id}] */
  const csvToOpp = (csv) =>
    csv.split(',').map((s) => s.trim()).filter(Boolean).map((id) => ({ id }));
  const stepId = crypto.randomUUID();   
  /* — submit — */
  const handleSubmit = () => {
    const payload = type === 'question'
      ? {
        stepId,
        type: 'question',
        question: qData.question.trim(),
        timeLimit: Number(qData.timeLimit) || 15000,
        messages: qData.messages,
        options: qData.options,
      }
      : {
        stepId,
        type: 'challenge',
        player: { id: cData.playerId.trim() },
        opponents: csvToOpp(cData.opponentsCsv),
      };

    onCreate?.(payload);
    setOpen(false);
    reset();
  };

  /* — render — */
  return (
    <>
      <Button
        variant="contained"
        sx={{ background: 'var(--primary)', '&:hover': { background: 'var(--primary-light)' } }}
        onClick={() => setOpen(true)}
      >
        + Step
      </Button>

      <ThemeProvider theme={glassTheme}>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
          keepMounted
        >
          <DialogTitle>
            <Typography variant="h6" component="span">
              Add new {type}
            </Typography>
          </DialogTitle>

          <DialogContent dividers>
            {/* type selector */}
            <FieldBox>
              <FormControl fullWidth>
                <InputLabel id="type-label" sx={{ color: 'var(--white-trans)' }}>
                  Type
                </InputLabel>
                <Select
                  labelId="type-label"
                  label="Type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  sx={{ color: '#fff' }}
                >
                  <MenuItem value="question">Question</MenuItem>
                  <MenuItem value="challenge">Challenge</MenuItem>
                </Select>
              </FormControl>
            </FieldBox>

            {/* ——— QUESTION FIELDS ——— */}
            {type === 'question' && (
              <>
                <FieldBox>
                  <TextField
                    label="Question"
                    multiline
                    minRows={3}
                    value={qData.question}
                    onChange={(e) => setQ({ ...qData, question: e.target.value })}
                    fullWidth
                  />
                </FieldBox>

                <FieldBox>
                  <TextField
                    label="Time limit (ms)"
                    type="number"
                    value={qData.timeLimit}
                    onChange={(e) => setQ({ ...qData, timeLimit: e.target.value })}
                    fullWidth
                  />
                </FieldBox>

                {['intro', 'correct', 'wrong'].map((key) => (
                  <FieldBox key={key}>
                    <TextField
                      label={`${key.charAt(0).toUpperCase() + key.slice(1)} message`}
                      value={qData.messages[key]}
                      onChange={(e) =>
                        setQ({ ...qData, messages: { ...qData.messages, [key]: e.target.value } })
                      }
                      fullWidth
                    />
                  </FieldBox>
                ))}

                {/* Options */}
                <Typography variant="subtitle1" mt={2}>
                  Options (choose correct)
                </Typography>
                <RadioGroup
                  value={qData.options.findIndex((o) => o.correct)}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setQ({
                      ...qData,
                      options: qData.options.map((o, i) => ({ ...o, correct: i === idx })),
                    });
                  }}
                >
                  {qData.options.map((opt, idx) => (
                    <FieldBox key={opt.id}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <FormControlLabel
                          value={idx}
                          control={<Radio sx={{ color: 'var(--primary)' }} />}
                          label=""
                        />
                        <TextField
                          label={`Option ${idx + 1}`}
                          value={opt.text}
                          onChange={(e) => {
                            const opts = [...qData.options];
                            opts[idx] = { ...opts[idx], text: e.target.value };
                            setQ({ ...qData, options: opts });
                          }}
                          fullWidth
                        />
                      </Box>
                    </FieldBox>
                  ))}
                </RadioGroup>
              </>
            )}

            {/* ——— CHALLENGE FIELDS ——— */}
            {type === 'challenge' && (
              <>
                <FieldBox>
                  <TextField
                    label="Player ID"
                    value={cData.playerId}
                    onChange={(e) => setC({ ...cData, playerId: e.target.value })}
                    fullWidth
                  />
                </FieldBox>

                <FieldBox>
                  <TextField
                    label="Opponent IDs (csv)"
                    value={cData.opponentsCsv}
                    onChange={(e) => setC({ ...cData, opponentsCsv: e.target.value })}
                    placeholder="id1, id2, id3"
                    fullWidth
                  />
                </FieldBox>
              </>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpen(false)} sx={{ color: 'var(--white-trans)' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{ background: 'var(--primary)', '&:hover': { background: 'var(--primary-light)' } }}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    </>
  );
}
