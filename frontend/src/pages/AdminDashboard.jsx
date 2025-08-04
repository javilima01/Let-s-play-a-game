import { useState, useEffect, cloneElement, isValidElement } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getAdminGames,
  createAdminGame,
  updateAdminGameMeta,
  getAdminSteps,
  createAdminStep,
  updateAdminStepOrder,
  patchAdminStep,
  deleteAdminStep,
} from "@/services/admin";
import StepRow from "@/components/StepRow";;
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

/* ──────────────────────────────────────────────────────────────
 * Sortable row wrapper
 * ─────────────────────────────────────────────────────────── */
 function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const dragAttributes = { ...attributes, ...listeners };

  return (
    <li ref={setNodeRef} style={style}>
      {/* protect against non-element children */}
      {isValidElement(children)
        ? cloneElement(children, { dragAttributes })
        : children}
    </li>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Admin dashboard – create & reorder steps easily
 * ─────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [games, setGames] = useState([]);
  const [selected, setSelected] = useState(null); // gameId
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

  /* Fetch games on mount */
  useEffect(() => {
    (async () => {
      const gs = await getAdminGames();
      setGames(gs);
      if (gs.length) setSelected(gs[0].gameId);
    })();
  }, []);

  /* Fetch steps whenever game selection changes */
  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    (async () => {
      const st = await getAdminSteps(selected);
      setSteps(st.sort((a, b) => a.step - b.step));
      setLoading(false);
    })();
  }, [selected]);

  /* DnD handler */
  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = steps.findIndex((s) => s._id === active.id);
    const newIndex = steps.findIndex((s) => s._id === over.id);
    const newArr = arrayMove(steps, oldIndex, newIndex).map((s, idx) => ({
      ...s,
      step: idx,
    }));
    setSteps(newArr);
    // debounce-not-needed for admin use
    await updateAdminStepOrder(selected, newArr.map(({ _id, step }) => ({ _id, step })));
  };

  /* Add new question placeholder */
  const addQuestion = async () => {
    const created = await createAdminStep(selected, {
      type: "question",
      step: steps.length,
      question: "New question…",
      timeLimit: 15000,
      options: [
        { id: 1, text: "A", correct: false },
        { id: 2, text: "B", correct: false },
        { id: 3, text: "C", correct: false },
        { id: 4, text: "D", correct: false },
      ],
    });
    setSteps((s) => [...s, created]);
  };

  const addChallenge = async () => {
    const created = await createAdminStep(selected, {
      type: "challenge",
      step: steps.length,
      challengeId: crypto.randomUUID(),
      player: {},
      opponents: [],
    });
    setSteps((s) => [...s, created]);
  };

  return (
    <div className="p-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Sidebar – games list */}
      <aside className="lg:col-span-1 space-y-4">
        <h2 className="text-xl font-bold">Games</h2>
        <ul className="space-y-2">
          {games.map((g) => (
            <li key={g.gameId}>
              <Button
                variant={selected === g.gameId ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelected(g.gameId)}
              >
                {g.title || g.gameId}
              </Button>
            </li>
          ))}
        </ul>
        <Button className="w-full" onClick={async () => {
          const g = await createAdminGame();
          setGames((arr) => [...arr, g]);
          setSelected(g.gameId);
        }}>+ New game</Button>
      </aside>

      {/* Steps editor */}
      <section className="lg:col-span-2">
        <header className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Steps for {selected}</h2>
          <div className="space-x-2">
            <Button onClick={addQuestion}>+ Question</Button>
            <Button variant="secondary" onClick={addChallenge}>+ Challenge</Button>
          </div>
        </header>

        {loading && <p>Loading…</p>}
        {!loading && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map((s) => s._id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {steps.map((s) => (
                  <SortableRow key={s._id} id={s._id}>
                    <StepRow
                  step={s}
                  onUpdate={async (patch) => {
                    setSteps((arr) =>
                      arr.map((it) =>
                        it._id === s._id ? { ...it, ...patch } : it,
                      ),
                    );
                    try {
                      await patchAdminStep(s._id, patch);
                    } catch (err) {
                      console.error("save failed", err);
                    }
                  }}
                  onDelete={async () => {
                    if (!window.confirm("Delete this step?")) return;
                    await deleteAdminStep(s._id);
                    setSteps((arr) => arr.filter((it) => it._id !== s._id));
                  }}
                />
                  </SortableRow>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </section>
    </div>
  );
}
