// src/components/AddStepForm.jsx
'use client';

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StepForm from './StepForm';

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

export default function AddStepForm({ onCreate }) {
  const [open, setOpen] = useState(false);

  const handleCreate = (payload) => {
    payload.stepId = crypto.randomUUID();
    onCreate(payload);
    setOpen(false);
  };

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
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth keepMounted>
          <DialogTitle>Add new step</DialogTitle>
          <DialogContent dividers>
            <StepForm
              onSubmit={handleCreate}
              onCancel={() => setOpen(false)}
              submitLabel="Create"
            />
          </DialogContent>
        </Dialog>
      </ThemeProvider>
    </>
  );
}
