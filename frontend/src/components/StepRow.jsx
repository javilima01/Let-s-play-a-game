// src/components/StepRow.jsx
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button as UiButton } from '@/components/ui/button';
import StepForm from './StepForm';
import styles from '@/css/StepRow.module.css';

// Glass theme for the edit dialog
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
  },
});

/**
 * StepRow renders a draggable step summary. Clicking the header
 * opens the StepForm dialog for editing.
 * Wrapped by SortableItem which provides the <li>.
 */
export default function StepRow({ step, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);

  // Memoized save handler to avoid re-creating on render
  const handleSave = useMemo(
    () => (updated) => {
      onUpdate(step.stepId, updated);
      setEditing(false);
    },
    [onUpdate, step.stepId]
  );

  return (
    <>
      <div className={styles.row}>
        <Card className="cursor-grab">
          <CardContent className="p-0">
            <div
              className={styles.header}
              onClick={() => setEditing(true)}
            >
              <GripVertical size={18} className={styles.dragIcon} />

              <div className={styles.titleBlock}>
                <span className={styles.titleText}>
                  {step.type.toUpperCase()} #{step.step}
                </span>
                <span className={styles.subText}>
                  {step.type === 'question'
                    ? step.question
                    : `vs ${step.opponents?.length ?? 0} opponents`}
                </span>
              </div>

              <UiButton
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(step.stepId);
                }}
                className={styles.deleteBtn}
              >
                <Trash2 size={16} />
              </UiButton>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit dialog for modifying the step */}
      <ThemeProvider theme={glassTheme}>
        <Dialog
          open={editing}
          onClose={() => setEditing(false)}
          maxWidth="sm"
          fullWidth
          keepMounted
        >
          <DialogTitle>Edit Step</DialogTitle>
          <DialogContent dividers>
            <StepForm
              initialValues={step}
              onCancel={() => setEditing(false)}
              onSubmit={handleSave}
              submitLabel="Save"
            />
          </DialogContent>
        </Dialog>
      </ThemeProvider>
    </>
  );
}