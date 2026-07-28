-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "OccurrenceLocation" AS ENUM ('SALA_DE_AULA', 'PATIO', 'QUADRA', 'BANHEIRO', 'CORREDORES');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Occurrence" ADD COLUMN IF NOT EXISTS "location" "OccurrenceLocation" NOT NULL DEFAULT 'SALA_DE_AULA';
ALTER TABLE "Occurrence" ALTER COLUMN "location" DROP DEFAULT;
