"use client";
import { PanelsTopLeft } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
export function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  const [maximized, setMaximized] = useState(false);
  return <section className={`sf-panel ${className} ${maximized ? "sf-panel-maximized" : ""}`}><header onDoubleClick={() => setMaximized(!maximized)} title="Double-click to maximize dock"><h2>{title}</h2><button className="sf-icon" aria-label={`${title} dock options`} onClick={() => setMaximized(!maximized)} title={maximized ? "Restore dock" : "Maximize dock"}><PanelsTopLeft size={12}/></button></header><div className="sf-panel-body">{children}</div></section>;
}
