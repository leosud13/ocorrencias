const MAX_PROFILE_IMAGE_BYTES = 750 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function fileToProfileImageDataUrl(file: File): Promise<string> {
  if (!ALLOWED_PROFILE_IMAGE_TYPES.has(file.type)) {
    throw new Error("A foto deve ser JPG, PNG, WEBP ou GIF.");
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("A foto deve ter no máximo 750 KB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}
