import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { emitKeypressEvents } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { prisma } from './lib/prisma.js';

const expectedDatabase = 'nutricontrol';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ask(label, fallback = '') {
  return new Promise((resolve) => {
    stdout.write(label);
    stdin.once('data', (value) => resolve(value.toString().trim() || fallback));
  });
}

function askHidden(label) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Ejecuta este comando en una terminal interactiva.');
  }
  return new Promise((resolve, reject) => {
    let value = '';
    emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    stdout.write(label);
    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        stdin.setRawMode(false);
        stdin.off('keypress', onKeypress);
        stdout.write('\n');
        reject(new Error('Operación cancelada.'));
      } else if (key.name === 'return' || key.name === 'enter') {
        stdin.setRawMode(false);
        stdin.off('keypress', onKeypress);
        stdout.write('\n');
        resolve(value);
      } else if (key.name === 'backspace') {
        value = value.slice(0, -1);
      } else if (character && !key.ctrl && !key.meta) {
        value += character;
      }
    };
    stdin.on('keypress', onKeypress);
  });
}

async function askPassword(label) {
  const password = await askHidden(`${label} contraseña (mínimo 8 caracteres): `);
  const confirmation = await askHidden('Confirma la contraseña: ');
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');
  return bcrypt.hash(password, 12);
}

try {
  const configuredUrl = new URL(process.env.DATABASE_URL || '');
  const configuredDatabase = configuredUrl.pathname.replace(/^\//, '');
  if (!['localhost', '127.0.0.1', '::1'].includes(configuredUrl.hostname) || configuredDatabase !== expectedDatabase) {
    throw new Error(`Operación detenida: este comando solo permite la base local ${expectedDatabase}.`);
  }

  const [userCount, patientCount, subscriptionCount, ticketCount] = await Promise.all([
    prisma.user.count(),
    prisma.patient.count(),
    prisma.subscription.count(),
    prisma.supportTicket.count(),
  ]);
  stdout.write(`Base verificada: ${expectedDatabase} en localhost.\n`);
  stdout.write(`Se reemplazarán ${userCount} usuarios; sus expedientes (${patientCount}), suscripciones/pagos y tickets vinculados también se eliminarán por cascada.\n`);
  stdout.write(`Tickets vinculados: ${ticketCount}; suscripciones vinculadas: ${subscriptionCount}.\n`);
  stdout.write('Las bitácoras y registros de pago de checkout aún pendiente no se borran con esta operación.\n');

  const adminName = await ask('Nombre visible del superadmin: ');
  const adminEmail = (await ask('Correo del superadmin: ')).toLowerCase();
  if (!adminName || !emailPattern.test(adminEmail)) throw new Error('Nombre o correo del superadmin inválido.');
  const adminPasswordHash = await askPassword('Superadmin:');
  const lifetimeName = await ask('Nombre de la cuenta vitalicia: ');
  const lifetimeEmail = (await ask('Correo de la cuenta vitalicia: ')).toLowerCase();
  if (!lifetimeName || !emailPattern.test(lifetimeEmail) || lifetimeEmail === adminEmail) {
    throw new Error('Nombre o correo vitalicio inválido; las cuentas deben usar correos diferentes.');
  }
  const lifetimePasswordHash = await askPassword(`${lifetimeName}:`);
  const confirmation = await ask(`Escribe REINICIAR ${expectedDatabase} para borrar y recrear las cuentas: `);
  if (confirmation !== `REINICIAR ${expectedDatabase}`) throw new Error('Confirmación incorrecta. No se modificó la base.');

  await prisma.$transaction(async (tx) => {
    await tx.user.deleteMany({});
    await tx.user.create({
      data: { name: adminName, email: adminEmail, passwordHash: adminPasswordHash, role: 'SUPERADMIN' },
    });
    const lifetimeUser = await tx.user.create({
      data: { name: lifetimeName, email: lifetimeEmail, passwordHash: lifetimePasswordHash, role: 'NUTRITIONIST' },
    });
    await tx.subscription.create({
      data: {
        userId: lifetimeUser.id,
        plan: 'LIFETIME',
        status: 'ACTIVE',
        price: 0,
        startedAt: new Date(),
        renewsAt: null,
      },
    });
  });

  stdout.write(`Reinicio completado. Superadmin: ${adminEmail}. Membresía vitalicia: ${lifetimeEmail}.\n`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
