import { NextResponse } from "next/server";
import {
  deleteCloudinaryImage,
  uploadImageToCloudinary,
} from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required." },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed." },
        { status: 400 },
      );
    }

    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: "Image must be smaller than 8MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadImageToCloudinary(buffer);

    return NextResponse.json({
      url: uploaded.url,
      publicId: uploaded.publicId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Delete an image from Cloudinary (used when user removes before save). */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let publicId = searchParams.get("publicId")?.trim() ?? "";

    if (!publicId) {
      const body = (await request.json().catch(() => null)) as {
        publicId?: string;
      } | null;
      publicId = body?.publicId?.trim() ?? "";
    }

    if (!publicId) {
      return NextResponse.json(
        { error: "publicId is required." },
        { status: 400 },
      );
    }

    await deleteCloudinaryImage(publicId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
