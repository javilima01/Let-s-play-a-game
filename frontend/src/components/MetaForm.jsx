import React from 'react';
import { Paper, Box, Typography, TextField, Button, Stack } from '@mui/material';
import dash from '@/css/AdminDashboard.module.css';

/**
 * Sidebar form for editing game metadata (title, description, opponents, and admin password).
 * Children (StepsPanel) now fully expand, letting the outer page scroll.
 */
const MetaForm = React.memo(function MetaForm({ meta, setMeta, savingMeta, onSave, onBack, children }) {
  const titleRef = React.useRef();
  const descRef = React.useRef();
  const oppRef = React.useRef();
  const pwdRef = React.useRef();

  const handleBlur = () => {
    setMeta({
      title: titleRef.current.value,
      description: descRef.current.value,
      opponents: "",
      password: pwdRef.current.value,
    });
  };

  return (
    <Paper
      className={dash.sidebar}
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 3,
        width: { xs: '100%', sm: 320 },
        boxSizing: 'border-box',
        height: '100%'
      }}
    >
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Game settings
      </Typography>

      {/* Meta fields */}
      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">Title</Typography>
        <TextField
          inputRef={titleRef}
          defaultValue={meta.title}
          onBlur={handleBlur}
          size="small"
          fullWidth
        />
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">Description</Typography>
        <TextField
          inputRef={descRef}
          defaultValue={meta.description}
          onBlur={handleBlur}
          multiline
          minRows={3}
          size="small"
          fullWidth
        />
      </Stack>

      {/* <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">Allowed opponents (CSV)</Typography>
        <TextField
          inputRef={oppRef}
          defaultValue={meta.opponents}
          onBlur={handleBlur}
          size="small"
          fullWidth
        />
      </Stack> */}

      {/* New: Admin password field */}
      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">Admin Password</Typography>
        <TextField
          inputRef={pwdRef}
          defaultValue={meta.password}
          onBlur={handleBlur}
          type="password"
          size="small"
          fullWidth
        />
      </Stack>

      {/* Render steps fully: no internal scroll */}
      {children && (
        <Box mt={2} mb={2}>
          {children}
        </Box>
      )}

      {/* Save bar */}
      <Box mt="auto">
        <Stack direction="column" spacing={1}>
          <Button
            type="button"
            variant="contained"
            fullWidth
            onClick={onSave}
            disabled={savingMeta}
            sx={{ py: 1.25, height: '100%', background: 'var(--primary)', '&:hover': { background: 'var(--primary-light)' } }}
          >
            {savingMeta ? 'Saving…' : 'Save'}
          </Button>
          <Button
            type="button"
            variant="text"
            fullWidth
            onClick={onBack}
            sx={{ py: 1 }}
          >
            ← Back to games
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
});

export default MetaForm;
