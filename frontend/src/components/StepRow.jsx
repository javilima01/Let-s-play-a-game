// src/components/StepRow.jsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { GripVertical, Trash2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function StepRow({ step, onUpdate, onDelete, dragAttributes }) {
  const [open, setOpen] = useState(false);

  const { register, watch, setValue, formState } = useForm({
    defaultValues: step,
  });

  // debounced autosave
  useEffect(() => {
    if (!formState.isDirty) return;
    const t = setTimeout(() => onUpdate(watch()), 400);
    return () => clearTimeout(t);
  }, [watch(), formState.isDirty]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <div>
        <Card className="cursor-default">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center gap-3 p-3">
              {/* drag handle */}
              <span
                {...dragAttributes}
                className="cursor-grab text-muted-foreground hover:text-primary"
              >
                <GripVertical size={18} />
              </span>

              {/* summary toggle */}
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex-1 justify-start text-left"
                >
                  <span className="font-medium">
                    {step.type.toUpperCase()} #{step.step}
                  </span>
                  <span className="ml-2 truncate text-muted-foreground">
                    {step.type === "question"
                      ? step.question
                      : `vs ${step.opponents?.length ?? 0} opponents`}
                  </span>
                </Button>
              </CollapsibleTrigger>

              {/* delete */}
              <Button
                size="icon"
                variant="ghost"
                onClick={onDelete}
                aria-label="Delete step"
              >
                <Trash2 className="text-destructive" size={18} />
              </Button>
            </div>

            {/* Editor */}
            <CollapsibleContent>
              {step.type === "question" && (
                <div className="space-y-4 p-4 border-t">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">Question</span>
                    <Input {...register("question")} />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-sm font-medium">Time limit (ms)</span>
                    <Input type="number" {...register("timeLimit")} />
                  </label>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Options</span>
                    {watch("options").map((opt, i) => (
                      <div key={opt.id ?? i} className="flex items-center gap-2">
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

              {step.type === "challenge" && (
                <div className="space-y-4 p-4 border-t">
                  {/* Later replace with autocomplete components */}
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">Player ID</span>
                    <Input {...register("player.id")} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">Opponent IDs (csv)</span>
                    <Input
                      {...register("opponents")}
                      placeholder="id1,id2,id3"
                      onBlur={(e) =>
                        setValue(
                          "opponents",
                          e.target.value.split(",").map((t) => t.trim()),
                          { shouldDirty: true },
                        )
                      }
                    />
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
