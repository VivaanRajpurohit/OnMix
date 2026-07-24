"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ title, children, onClose, width = 520, className = "", bodyClassName = "" }: { title: string; children: ReactNode; onClose(): void; width?: number; className?: string; bodyClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => { const previous = document.activeElement as HTMLElement; ref.current?.querySelector<HTMLElement>("button,input,select,textarea")?.focus(); const key = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current(); document.addEventListener("keydown", key); return () => { document.removeEventListener("keydown", key); previous?.focus(); }; }, []);
  return <div className="sf-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className={`sf-modal ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby="modal-title" style={{ width }} ref={ref}><header><h2 id="modal-title">{title}</h2><button className="sf-icon" onClick={onClose} aria-label="Close dialog"><X size={14}/></button></header><div className={`sf-modal-body ${bodyClassName}`.trim()}>{children}</div></div></div>;
}
