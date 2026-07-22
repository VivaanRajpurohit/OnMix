"use client";
import { useEffect, useRef, useState } from "react";

export interface MenuAction { label: string; shortcut?: string; disabled?: boolean; divider?: boolean; action?(): void }
export function DesktopMenu({ label, items }: { label: string; items: MenuAction[] }) {
  const [open, setOpen] = useState(false), ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  return <div className="sf-menu-root" ref={ref}><button className={open ? "active" : ""} onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open}>{label}</button>{open && <div className="sf-menu" role="menu">{items.map((item, i) => item.divider ? <div className="sf-menu-divider" key={i}/> : <button key={`${item.label}-${i}`} role="menuitem" disabled={item.disabled} onClick={() => { item.action?.(); setOpen(false); }}><span>{item.label}</span>{item.shortcut && <kbd>{item.shortcut}</kbd>}</button>)}</div>}</div>;
}

