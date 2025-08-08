// StepsPanel.jsx
import React, { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableItem from '@/components/SortableItem';
import StepRow from '@/components/StepRow';
import AddStepForm from '@/components/AddStepForm';
import dash from '@/css/AdminDashboard.module.css';

/**
 * Panel for displaying, reordering, and managing steps.
 * Memoized to avoid re-renders when unrelated props change, with stable handlers.
 */
const StepsPanel = React.memo(function StepsPanel({
  steps,
  loading,
  sensors,
  handleDragEnd,
  handleCreateStep,
  onUpdate,
  onDelete,
}) {
  // Pre-bind update & delete handlers per step, only when steps or callbacks change
  const updateHandlers = useMemo(() => {
    const map = {};
    steps.forEach((s) => {
      map[s.stepId] = (patch) => onUpdate(s.stepId, patch);
    });
    return map;
  }, [steps, onUpdate]);

  const deleteHandlers = useMemo(() => {
    const map = {};
    steps.forEach((s) => {
      map[s.stepId] = () => onDelete(s.stepId);
    });
    return map;
  }, [steps, onDelete]);

  // Memoize rendered items so they only change when steps or handlers change
  const stepItems = useMemo(
    () =>
      steps.map((s) => (
        <SortableItem key={s.stepId} id={s.stepId}>
          <StepRow
            step={s}
            onUpdate={updateHandlers[s.stepId]}
            onDelete={deleteHandlers[s.stepId]}
          />
        </SortableItem>
      )),
    [steps, updateHandlers, deleteHandlers]
  );

  return (
    <Paper
      className={`${dash.cardGlass} ${dash.mainPanel}`}
      sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      <Box
        className={dash.mainHeader}
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography className={dash.sectionTitle}>Steps ({steps.length})</Typography>
        <Box className={dash.actionBar}>
          <AddStepForm onCreate={handleCreateStep} />
        </Box>
      </Box>

      {loading ? (
        <Typography>Loading…</Typography>
      ) : (
        <Box className={dash.stepsWrap}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={steps.map((s) => s.stepId)}
              strategy={verticalListSortingStrategy}
            >
              <ul className={dash.itemWrapper}>{stepItems}</ul>
            </SortableContext>
          </DndContext>
        </Box>
      )}
    </Paper>
  );
});

export default StepsPanel;