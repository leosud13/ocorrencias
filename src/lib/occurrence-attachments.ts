import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function saveOccurrenceAttachments(
  occurrenceId: string,
  files: File[],
  tx?: Prisma.TransactionClient,
) {
  if (files.length === 0) return [];

  const client = tx ?? prisma;
  const baseDir = path.join(process.cwd(), "uploads", occurrenceId);
  await mkdir(baseDir, { recursive: true });

  const created = [];

  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    const safe = sanitizeFileName(file.name || "arquivo");
    const storedName = `${randomUUID()}-${safe}`;
    const storedPath = path.join("uploads", occurrenceId, storedName);
    await writeFile(path.join(process.cwd(), storedPath), buf);

    const attachment = await client.occurrenceAttachment.create({
      data: {
        occurrenceId,
        fileName: file.name || "arquivo",
        storedPath,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: buf.length,
      },
    });
    created.push(attachment);
  }

  return created;
}
