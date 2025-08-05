/* src/components/StepRow.jsx */
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Trash2, GripVertical } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { csvToOpponents, opponentsToCsv } from "@/services/utils";
import rowCss from "@/css/StepRow.module.css";         // ← import the module

export default function StepRow({ step, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);

  /* form setup (unchanged) */
  const defaultValues =
    step.type === "challenge"
      ? { ...step, opponentsCsv: opponentsToCsv(step.opponents ?? []) }
      : step;

  const {
    register,
    watch,
    setValue,
    reset,
    formState: { isDirty },
  } = useForm({ defaultValues });

  const watched = watch();

  const getSanitized = () =>
    watched.type === "challenge"
      ? { ...watched, opponents: csvToOpponents(watched.opponentsCsv ?? "") }
      : watched;

  useEffect(() => {
    if (!isDirty) return;
    const t = setTimeout(() => {
      const payload = getSanitized();
      onUpdate(payload);
      reset(payload);
    }, 500);
    return () => clearTimeout(t);
  }, [isDirty]);

  const optionKey = (opt, i) => `${step.stepId || step._id}-${opt.id ?? i}`;
  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      {/* add .open class when expanded */}
      <div className={`${rowCss.row} ${open ? rowCss.open : ""}`}>
        <Card className="cursor-grab">
          <CardContent className="p-0">
            {/* header */}
            <div className={rowCss.header}>
              <GripVertical size={18} className="text-muted-foreground" />

              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex-1 justify-start text-left p-0"
                >
                  <span className={rowCss.title}>
                    {step.type.toUpperCase()} #{step.step}
                  </span>
                  <span className={rowCss.subtitle}>
                    {step.type === "question"
                      ? step.question
                      : `vs ${step.opponents?.length ?? 0} opps`}
                  </span>
                </Button>
              </CollapsibleTrigger>

              <button
                className={rowCss.deleteBtn}
                onClick={onDelete}
                aria-label="Delete"
              >
                <Trash2 size={18} className="text-destructive" />
              </button>
            </div>

            {/* body */}
            <CollapsibleContent>
              {watched.type === "question" && (
                <div className={`${rowCss.body} ${rowCss.gridCols}`}>
                  <label className={rowCss.label}>
                    Question
                    <Textarea {...register("question")} className={rowCss.glassField} />
                  </label>

                  <label className={rowCss.label}>
                    Time limit (ms)
                    <Input type="number" {...register("timeLimit")} className={rowCss.glassField} />
                  </label>

                  {["intro", "correct", "wrong"].map((k) => (
                    <label key={k} className={rowCss.label}>
                      {k} message
                      <Input {...register(`messages.${k}`)} className={rowCss.glassField} />
                    </label>
                  ))}

                  <div className="col-span-full space-y-2">
                    <span className={rowCss.label}>Options</span>
                    {watched.options?.map((opt, i) => (
                      <div key={optionKey(opt, i)} className={rowCss.optionRow}>
                        <Switch
                          checked={opt.correct}
                          onCheckedChange={(v) =>
                            setValue(`options.${i}.correct`, v, {
                              shouldDirty: true,
                            })
                          }
                        />
                        <Input
                          className="flex-1"
                          {...register(`options.${i}.text`)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {watched.type === "challenge" && (
                <div className={rowCss.body}>
                  <label className={rowCss.label}>
                    Player ID
                    <Input className={rowCss.glassField} {...register("player.id")} />
                  </label>
                  <label className={rowCss.label}>
                    Opponent IDs (csv)
                    <Input {...register("opponentsCsv")} />
                  </label>
                </div>
              )}
            </CollapsibleContent>
          </CardContent>
        </Card>
      </div>
    </Collapsible>
  );
}
