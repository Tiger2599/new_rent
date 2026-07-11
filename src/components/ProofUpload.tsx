"use client";

import { useRef, useState } from "react";
import ImagePreview from "@/components/ImagePreview";
import { compressImage } from "@/lib/compress-image";
import type { TenantProof } from "@/types/tenant";

type ProofUploadProps = {
  value: TenantProof[];
  onChange: (proofs: TenantProof[]) => void;
  disabled?: boolean;
  max?: number;
};

export default function ProofUpload({
  value,
  onChange,
  disabled,
  max = 10,
}: ProofUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  async function uploadFiles(files: FileList | File[] | null | undefined) {
    if (!files || files.length === 0) return;

    const remaining = max - value.length;
    if (remaining <= 0) {
      setError(`You can upload up to ${max} images.`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    setError("");
    setUploading(true);

    const uploaded: TenantProof[] = [];

    try {
      for (let i = 0; i < selected.length; i++) {
        const file = selected[i];
        const label =
          selected.length > 1 ? `${i + 1}/${selected.length}` : "";

        setStatus(label ? `Compressing ${label}...` : "Compressing...");
        const compressed = await compressImage(file);

        setStatus(label ? `Uploading ${label}...` : "Uploading...");
        const body = new FormData();
        body.append("file", compressed);

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 60_000);

        let res: Response;
        try {
          res = await fetch("/api/upload", {
            method: "POST",
            body,
            signal: controller.signal,
          });
        } catch (err) {
          window.clearTimeout(timeout);
          if (err instanceof DOMException && err.name === "AbortError") {
            throw new Error(
              "Upload timed out. Check your internet and try again.",
            );
          }
          throw new Error("Upload failed. Check your internet and try again.");
        }
        window.clearTimeout(timeout);

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Upload failed.");
        }

        uploaded.push({ url: data.url, publicId: data.publicId });
        if (uploaded.length > 0) {
          onChange([...value, ...uploaded]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
      }
    } finally {
      setUploading(false);
      setStatus("");
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const canAdd = value.length < max;
  const busyLabel = status || "Uploading...";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="block text-sm font-medium text-gray-700">
          Proof Images
        </span>
        <span className="text-xs text-gray-400">
          {value.length}/{max}
        </span>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {value.map((proof, index) => (
            <div
              key={`${proof.publicId}-${index}`}
              className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
            >
              <button
                type="button"
                onClick={() => {
                  setPreviewIndex(index);
                  setPreviewOpen(true);
                }}
                className="block w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proof.url}
                  alt={`Proof ${index + 1}`}
                  className="h-28 w-full object-cover"
                />
              </button>
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => removeAt(index)}
                className="absolute right-1.5 top-1.5 rounded bg-red-600/90 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {uploading ? busyLabel : "Upload Files"}
          </button>
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => cameraRef.current?.click()}
            className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {uploading ? busyLabel : "Take Photo"}
          </button>
        </div>
      )}

      {uploading && (
        <p className="text-xs text-gray-500">{busyLabel}</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <ImagePreview
        open={previewOpen}
        index={previewIndex}
        images={value.map((p, i) => ({
          url: p.url,
          alt: `Proof ${i + 1}`,
        }))}
        onClose={() => setPreviewOpen(false)}
        onIndexChange={setPreviewIndex}
      />
    </div>
  );
}
