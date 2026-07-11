import { v2 as cloudinary } from "cloudinary";

function getCloudinaryConfig() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local",
    );
  }

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });

  return cloudinary;
}

export type UploadedImage = {
  url: string;
  publicId: string;
};

export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  folder = "rent-proofs",
): Promise<UploadedImage> {
  const client = getCloudinaryConfig();

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    client.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
          // Faster ingest; delivery still looks good for proof docs
          transformation: [
            { width: 1600, height: 1600, crop: "limit" },
            { quality: "auto:good", fetch_format: "auto" },
          ],
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            const message =
              typeof error?.message === "string"
                ? error.message
                : "Cloudinary upload failed.";
            reject(new Error(message));
            return;
          }
          resolve({
            secure_url: uploaded.secure_url,
            public_id: uploaded.public_id,
          });
        },
      )
      .end(fileBuffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export async function deleteCloudinaryImage(publicId?: string | null) {
  if (!publicId) return;

  try {
    const client = getCloudinaryConfig();
    await client.uploader.destroy(publicId);
  } catch {
    // ignore cleanup failures
  }
}
