"use client";

import { useEffect } from "react";

type ImagePreviewProps = {
  images: { url: string; alt?: string }[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export default function ImagePreview({
  images,
  index,
  open,
  onClose,
  onIndexChange,
}: ImagePreviewProps) {
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") {
        onIndexChange((index + 1) % images.length);
      }
      if (e.key === "ArrowLeft") {
        onIndexChange((index - 1 + images.length) % images.length);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onClose, onIndexChange]);

  if (!open || images.length === 0) return null;

  const current = images[index] ?? images[0];

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="text-sm">
          {index + 1} / {images.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-sm hover:bg-white/10"
        >
          Close
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
        {images.length > 1 && (
          <button
            type="button"
            aria-label="Previous image"
            onClick={() =>
              onIndexChange((index - 1 + images.length) % images.length)
            }
            className="absolute left-3 z-10 rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25"
          >
            ‹
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt ?? "Preview"}
          className="max-h-full max-w-full rounded-lg object-contain"
        />

        {images.length > 1 && (
          <button
            type="button"
            aria-label="Next image"
            onClick={() => onIndexChange((index + 1) % images.length)}
            className="absolute right-3 z-10 rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}
