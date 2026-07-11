import { NextResponse } from "next/server";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

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
