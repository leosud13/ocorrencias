-- CreateEnum
CREATE TYPE "OccurrenceStudentRole" AS ENUM ('AUTOR', 'VITIMA', 'TESTEMUNHA');

-- AlterTable
ALTER TABLE "Occurrence" ADD COLUMN IF NOT EXISTS "studentRoles" "OccurrenceStudentRole"[] DEFAULT ARRAY[]::"OccurrenceStudentRole"[];
