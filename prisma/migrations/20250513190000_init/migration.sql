-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PROFESSOR', 'GESTAO');

-- CreateEnum
CREATE TYPE "OccurrenceReason" AS ENUM (
  'INDISCIPLINA',
  'USO_CELULAR',
  'SAIU_SEM_AUTORIZACAO',
  'NAO_FEZ_ATIVIDADE',
  'LINGUAGEM_IMPROPRIA',
  'BULLYING',
  'AGRESSAO',
  'SUBSTANCIAS_ILICITAS',
  'DESACATO_FUNCIONARIO',
  'CONVERSAS_PARALELAS'
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateTable
CREATE TABLE "SchoolClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ra" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Student_ra_key" ON "Student"("ra");
CREATE INDEX "Student_classId_idx" ON "Student"("classId");

-- CreateTable
CREATE TABLE "Occurrence" (
    "id" TEXT NOT NULL,
    "controlNumber" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "reason" "OccurrenceReason" NOT NULL,
    "details" TEXT,
    "parentName" TEXT,
    "parentPhone" TEXT,
    "parentEmail" TEXT,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Occurrence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Occurrence_controlNumber_key" ON "Occurrence"("controlNumber");
CREATE INDEX "Occurrence_authorId_idx" ON "Occurrence"("authorId");
CREATE INDEX "Occurrence_classId_idx" ON "Occurrence"("classId");
CREATE INDEX "Occurrence_registeredAt_idx" ON "Occurrence"("registeredAt");

-- CreateTable
CREATE TABLE "OccurrenceAttachment" (
    "id" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OccurrenceAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OccurrenceAttachment_occurrenceId_idx" ON "OccurrenceAttachment"("occurrenceId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OccurrenceAttachment" ADD CONSTRAINT "OccurrenceAttachment_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "Occurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
