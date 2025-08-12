"use client";
import { ReactNode } from "react";

export default function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white text-black rounded shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="font-semibold">{title}</div>
          <button aria-label="Close" className="px-2 py-1 border rounded" onClick={onClose}>×</button>
        </div>
        <div className="p-4 text-black">{children}</div>
      </div>
    </div>
  );
}


