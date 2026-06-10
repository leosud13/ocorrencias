-- Block PostgREST/anon access to application tables.
-- Prisma connects as postgres (bypasses RLS); the app does not use Supabase client.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SchoolClass" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Occurrence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OccurrenceAttachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
