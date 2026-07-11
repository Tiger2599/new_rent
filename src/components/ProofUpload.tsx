"use client";

import { useRef, useState } from "react";
import ImagePreview from "@/components/ImagePreview";
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

    for (const file of selected) {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();

      if (!res.ok) {
        setUploading(false);
        setError(data.error ?? "Upload failed.");
        if (uploaded.length > 0) {
          onChange([...value, ...uploaded]);
        }
        return;
      }

      uploaded.push({ url: data.url, publicId: data.publicId });
    }

    setUploading(false);
    onChange([...value, ...uploaded]);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const canAdd = value.length < max;

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
            {uploading ? "Uploading..." : "Upload Files"}
          </button>
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => cameraRef.current?.click()}
            className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Take Photo"}
          </button>
        </div>
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
