import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const gestaoPass = await bcrypt.hash("Gestao123!", 10);
  const profPass = await bcrypt.hash("Professor123!", 10);

  await prisma.user.upsert({
    where: { email: "gestao@escola.local" },
    update: {},
    create: {
      email: "gestao@escola.local",
      name: "Coordenação Pedagógica",
      passwordHash: gestaoPass,
      role: UserRole.GESTAO,
    },
  });

  await prisma.user.upsert({
    where: { email: "professor@escola.local" },
    update: {},
    create: {
      email: "professor@escola.local",
      name: "Maria Silva",
      passwordHash: profPass,
      role: UserRole.PROFESSOR,
    },
  });

  const turmaA = await prisma.schoolClass.upsert({
    where: { id: "seed-class-a" },
    update: {},
    create: { id: "seed-class-a", name: "9º Ano A" },
  });

  const turmaB = await prisma.schoolClass.upsert({
    where: { id: "seed-class-b" },
    update: {},
    create: { id: "seed-class-b", name: "9º Ano B" },
  });

  await prisma.student.upsert({
    where: { ra: "RA000000001SP" },
    update: {},
    create: {
      name: "João Pereira",
      ra: "RA000000001SP",
      classId: turmaA.id,
    },
  });

  await prisma.student.upsert({
    where: { ra: "RA000000002SP" },
    update: {},
    create: {
      name: "Ana Costa",
      ra: "RA000000002SP",
      classId: turmaA.id,
    },
  });

  await prisma.student.upsert({
    where: { ra: "RA000000003SP" },
    update: {},
    create: {
      name: "Pedro Santos",
      ra: "RA000000003SP",
      classId: turmaB.id,
    },
  });

  console.log("Seed concluído: usuários e turmas de exemplo criados.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
