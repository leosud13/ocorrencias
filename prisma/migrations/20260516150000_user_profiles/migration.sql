-- Add the agente escolar profile and account management fields.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'AGENTE_ESCOLAR';

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "blockedAt" TIMESTAMP(3);
