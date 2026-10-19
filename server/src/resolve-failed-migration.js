import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const migrationName = '20261019120000_nutritionist_pdf_profile';
const prisma = new PrismaClient();

try {
  const failedRows = await prisma.$queryRaw`
    SELECT migration_name
    FROM _prisma_migrations
    WHERE migration_name = ${migrationName}
      AND finished_at IS NULL
      AND rolled_back_at IS NULL
  `;

  if (failedRows.length > 0) {
    console.log(`Resolviendo migración fallida ${migrationName}.`);
    execFileSync('npx', ['prisma', 'migrate', 'resolve', '--rolled-back', migrationName], { stdio: 'inherit' });
  }
} catch (error) {
  console.error('No se pudo revisar o resolver la migración fallida.', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}