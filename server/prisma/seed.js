import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const demo = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', name: 'Demo User', passwordHash },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice', passwordHash },
  });

  const existing = await prisma.project.findFirst({
    where: { name: 'Website Revamp', ownerId: demo.id },
  });
  if (existing) {
    console.log('Seed already applied; skipping.');
    return;
  }

  const project = await prisma.project.create({
    data: {
      name: 'Website Revamp',
      description: 'Redesign and relaunch the marketing site.',
      ownerId: demo.id,
      members: {
        create: [
          { userId: demo.id, role: 'OWNER' },
          { userId: alice.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const tasks = [
    { title: 'Gather design references', status: 'NEW', position: 0, priority: 'NORMAL' },
    { title: 'Write content brief', status: 'NEW', position: 1, priority: 'LOW' },
    {
      title: 'Build homepage prototype',
      status: 'IN_PROGRESS',
      position: 0,
      priority: 'HIGH',
      assigneeId: alice.id,
    },
    {
      title: 'Set up staging environment',
      status: 'IN_PROGRESS',
      position: 1,
      priority: 'NORMAL',
      assigneeId: demo.id,
    },
    { title: 'Archive legacy assets', status: 'DONE', position: 0, priority: 'LOW' },
  ];

  for (const t of tasks) {
    await prisma.workPackage.create({
      data: { projectId: project.id, ...t },
    });
  }

  console.log('Seed complete. Login with demo@example.com / demo1234');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
