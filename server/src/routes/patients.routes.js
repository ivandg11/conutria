import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const idSchema = z.coerce.number().int().positive();

const emptyToNull = (v) => (v === '' ? null : v);

const optionalText = z.preprocess(
  emptyToNull,
  z.string().trim().nullable().optional(),
);

const patientSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  birthDate: z.preprocess(emptyToNull, z.coerce.date().nullable().optional()),
  sex: z.preprocess(emptyToNull, z.enum(['F', 'M', 'O']).nullable().optional()),
  phone: optionalText,
  email: z.preprocess(emptyToNull, z.string().email().nullable().optional()),
  goal: optionalText,
  allergies: optionalText,
  notes: optionalText,
  medicalHistory: z.record(z.string().max(40), z.string().max(2000)).optional(),
});

router.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const status = req.query.status === 'DISCHARGED' ? 'DISCHARGED' : 'ACTIVE';
  const patients = await prisma.patient.findMany({
    where: {
      userId: req.userId,
      status,
      ...(q && {
        OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }],
      }),
    },
    orderBy: { lastName: 'asc' },
  });
  res.json(patients);
});

router.post('/', async (req, res) => {
  const data = patientSchema.parse(req.body);
  const patient = await prisma.patient.create({
    data: { ...data, userId: req.userId },
  });
  res.status(201).json(patient);
});

router.get('/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const patient = await prisma.patient.findFirst({
    where: { id, userId: req.userId },
  });
  if (!patient)
    return res.status(404).json({ error: 'Paciente no encontrado' });
  res.json(patient);
});

router.put('/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const data = patientSchema.partial().parse(req.body);
  const exists = await prisma.patient.findFirst({
    where: { id, userId: req.userId },
  });
  if (!exists) return res.status(404).json({ error: 'Paciente no encontrado' });
  res.json(await prisma.patient.update({ where: { id }, data }));
});

router.delete('/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const exists = await prisma.patient.findFirst({
    where: { id, userId: req.userId },
  });
  if (!exists) return res.status(404).json({ error: 'Paciente no encontrado' });
  await prisma.patient.delete({ where: { id } });
  res.status(204).end();
});
router.patch('/:id/status', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const { status } = z
    .object({ status: z.enum(['ACTIVE', 'DISCHARGED']) })
    .parse(req.body);
  const exists = await prisma.patient.findFirst({
    where: { id, userId: req.userId },
  });
  if (!exists) return res.status(404).json({ error: 'Paciente no encontrado' });
  const updated = await prisma.patient.update({
    where: { id },
    data: { status, dischargedAt: status === 'DISCHARGED' ? new Date() : null },
  });
  res.json(updated);
});
export default router;
