/**
 * Resize + compress a camera/gallery image in the browser before upload.
 * Phone photos are often 5–12MB; this typically yields ~150–400KB JPEGs.
 */
export async function compressImage(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    /** Skip work if file is already under this size (bytes). */
    skipUnderBytes?: number;
  },
): Promise<File> {
  const maxWidth = options?.maxWidth ?? 1600;
  const maxHeight = options?.maxHeight ?? 1600;
  const quality = options?.quality ?? 0.72;
  const skipUnderBytes = options?.skipUnderBytes ?? 350_000;

  if (
    file.size <= skipUnderBytes &&
    (file.type === "image/jpeg" || file.type === "image/webp")
  ) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // HEIC / unsupported decode — send original and let server handle it
    return file;
  }

  const scale = Math.min(
    1,
    maxWidth / bitmap.width,
    maxHeight / bitmap.height,
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/jpeg", quality);
  });

  if (!blob || blob.size >= file.size) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "proof";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
