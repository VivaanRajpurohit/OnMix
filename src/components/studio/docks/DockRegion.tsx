"use client";

import { Fragment, useRef, useState, type ReactNode } from "react";
import { useStudioStore } from "@/store/studioStore";

export interface DockItem { id: string; content: ReactNode }
const DEFAULT_WIDTHS = [26, 22, 26, 11, 15];

export function DockRegion({ items }: { items: DockItem[] }) {
  const project = useStudioStore((s) => s.project);
  const commit = useStudioStore((s) => s.commit);
  const hidden = project.ui.hiddenDocks ?? [];
  const saved = project.ui.dockWidths?.length === items.length ? project.ui.dockWidths : DEFAULT_WIDTHS;
  const [draft, setDraft] = useState<number[] | null>(null);
  const draftRef = useRef<number[] | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const widths = draft ?? saved;
  const active = items.map((item, index) => ({ ...item, index })).filter((item) => !hidden.includes(item.id));

  const beginResize = (event: React.PointerEvent, leftIndex: number, rightIndex: number) => {
    event.preventDefault();
    const startX = event.clientX;
    const start = [...widths];
    const totalWidth = regionRef.current?.clientWidth ?? 1;
    const move = (pointer: PointerEvent) => {
      const delta = ((pointer.clientX - startX) / totalWidth) * 100;
      const next = [...start];
      next[leftIndex] = Math.max(8, start[leftIndex] + delta);
      next[rightIndex] = Math.max(8, start[rightIndex] - delta);
      if (next[leftIndex] === 8 || next[rightIndex] === 8) return;
      draftRef.current = next;
      setDraft(next);
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      const next = draftRef.current;
      if (next) commit((current) => ({ ...current, ui: { ...current.ui, dockWidths: next } }));
      draftRef.current = null;
      setDraft(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end, { once: true });
  };

  const columns = active.flatMap((item, index) => [
    `${widths[item.index]}fr`,
    ...(index < active.length - 1 ? ["5px"] : []),
  ]).join(" ");

  return <div className="sf-docks" ref={regionRef} style={{ gridTemplateColumns: columns }}>
    {active.map((item, index) => <Fragment key={item.id}>
      <div className="sf-dock-slot" data-dock={item.id}>{item.content}</div>
      {index < active.length - 1 && <div className="sf-dock-divider" role="separator" aria-orientation="vertical" aria-label={`Resize ${item.id} dock`} onPointerDown={(event) => beginResize(event, item.index, active[index + 1].index)}/>} 
    </Fragment>)}
  </div>;
}
