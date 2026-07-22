"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ title, children, onClose, width = 520 }: { title: string; children: ReactNode; onClose(): void; width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement; ref.current?.querySelector<HTMLElement>("button,input,select,textarea")?.focus(); const key = (e: KeyboardEvent) => e.key === "Escape" && onClose(); document.addEventListener("keydown", key); return () => { document.removeEventListener("keydown", key); previous?.focus(); }; }, [onClose]);
  return <div className="sf-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="sf-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" style={{ width }} ref={ref}><header><h2 id="modal-title">{title}</h2><button className="sf-icon" onClick={onClose} aria-label="Close dialog"><X size={14}/></button></header><div className="sf-modal-body">{children}</div></div></div>;
}

