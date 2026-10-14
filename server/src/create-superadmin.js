import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { emitKeypressEvents } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { prisma } from './lib/prisma.js';

function ask(label) {
  return new Promise((resolve) => {
    stdout.write(label);
    stdin.once('data', (value) => resolve(value.toString().trim()));
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

try {
  const name = await ask('Nombre: ');
  const email = (await ask('Correo: ')).toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Ingresa un nombre y un correo válidos.');
  }

  const password = await askHidden('Contraseña (mínimo 8 caracteres): ');
  const confirmation = await askHidden('Confirma la contraseña: ');
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Ese correo ya tiene una cuenta. Usa otro correo para crear una cuenta nueva.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: 'SUPERADMIN' },
    select: { id: true, name: true, email: true, role: true },
  });
  stdout.write(`Cuenta creada: ${user.name} (${user.email}) · ${user.role}\n`);
  stdout.write('Ya puedes iniciar sesión y abrir /admin.\n');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
