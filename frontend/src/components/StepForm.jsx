// src/components/StepForm.jsx
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Stack,
  Radio,
  Button,  // Imported Button
} from '@mui/material';

export default function StepForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}) {
  const vals = initialValues || {};

  const defaultVals = {
    type: vals.type ?? 'question',
    step: vals.step ?? 0,
    stepId: vals.stepId ?? '',
    question: vals.question ?? '',
    timeLimit: vals.timeLimit ?? 15000,
    messages: {
      intro: vals.messages?.intro ?? '',
      correct: vals.messages?.correct ?? '',
      wrong: vals.messages?.wrong ?? '',
    },
    options:
      vals.options ??
      Array.from({ length: 4 }, (_, i) => ({
        id: i + 1,
        text: '',
        correct: i === 0,
      })),
    // player: { id: vals.player?.id ?? '' },
    // opponentsCsv: vals.opponents?.map((o) => o.id).join(', ') ?? '',
    clue: vals.clue ?? '',
    challenge_action: vals.challenge_action ?? '',
  };

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({ defaultValues: defaultVals });

  useEffect(() => {
    if (initialValues?.stepId) {
      reset(defaultVals);
    }
  }, [initialValues?.stepId, reset]);

  const type = watch('type');
  const options = watch('options');

  const internalSubmit = (values) => {
    if (values.type === 'question') {
      onSubmit({
        type: 'question',
        step: values.step,
        stepId: values.stepId,
        question: values.question,
        timeLimit: values.timeLimit,
        messages: values.messages,
        options: values.options,
      });
    } else {

      onSubmit({
        type: 'challenge',
        step: values.step,
        stepId: values.stepId,
        // player: { id: values.player.id },
        clue: values.clue,
        challenge_action: values.challenge_action,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(internalSubmit)}>
      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          label="Step #"
          type="number"
          size="small"
          {...register('step', { valueAsNumber: true })}
        />

        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select {...field} label="Type">
                <MenuItem value="question">Question</MenuItem>
                <MenuItem value="challenge">Challenge</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Stack>

      {type === 'question' ? (
        <>
          <Box mb={2}>
            <TextField
              label="Question"
              fullWidth
              multiline
              minRows={3}
              {...register('question')}
            />
          </Box>

          <Box mb={2}>
            <TextField
              label="Time limit (ms)"
              type="number"
              fullWidth
              {...register('timeLimit', { valueAsNumber: true })}
            />
          </Box>

          {['intro', 'correct', 'wrong'].map((k) => (
            <Box mb={2} key={k}>
              <TextField
                label={`${k[0].toUpperCase() + k.slice(1)} message`}
                fullWidth
                {...register(`messages.${k}`)}
              />
            </Box>
          ))}

          <Typography variant="subtitle1" gutterBottom>
            Options (choose correct)
          </Typography>
          <Stack spacing={2} mb={2}>
            {options.map((_, i) => (
              <Box key={i} display="flex" alignItems="center" gap={2}>
                <Radio
                  {...register(`options.${i}.correct`)}
                  checked={options[i].correct}
                  onChange={() => {
                    options.forEach((_, j) =>
                      setValue(`options.${j}.correct`, j === i)
                    );
                  }}
                />
                <TextField
                  label={`Option ${i + 1}`}
                  fullWidth
                  {...register(`options.${i}.text`)}
                />
              </Box>
            ))}
          </Stack>
        </>
      ) : (
        <>
          {/* <Box mb={2}>
            <TextField
              label="Player ID"
              fullWidth
              {...register('player.id')}
            />
          </Box>
          <Box mb={2}>
            <TextField
              label="Opponent IDs (CSV)"
              fullWidth
              {...register('opponentsCsv')}
            />
          </Box> */}

          <Box mb={2}>
            <TextField
              label="Clue"
              fullWidth
              {...register('clue')}
            />
          </Box>

          <Box mb={2}>
            <TextField
              label="Action"
              fullWidth
              {...register('challenge_action')}
            />
          </Box>
        </>
      )}

      <Box display="flex" justifyContent="flex-end" gap={1}>
        {onCancel && (
          <Button variant="text" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="contained" disabled={!isDirty}>
          {submitLabel}
        </Button>
      </Box>
    </form>
  );
}