import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/requireActiveSubscription.js';

const router = Router();
router.use(requireAuth, requireActiveSubscription);

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

const mealPlanSchema = z.object({
  title: z.string().trim().min(1).max(120),
  startDate: z.coerce.date(),
  content: z.object({
    meals: z.array(z.object({
      name: z.string().trim().min(1).max(80),
      time: z.string().max(5).optional(),
      foods: z.array(z.object({
        name: z.string().trim().min(1).max(120),
        group: z.string().trim().max(80),
        portion: z.string().trim().min(1).max(80),
        equivalents: z.coerce.number().min(0).max(100),
      })).max(40),
    })).max(12),
    notes: z.string().max(3000).optional(),
  }),
});

const mealFoodSchema = z.object({
  name: z.string().trim().min(1).max(120),
  group: z.string().trim().min(1).max(80),
  portion: z.string().trim().min(1).max(80),
  equivalents: z.coerce.number().min(0).max(100),
});

router.get('/meal-foods', async (req, res) => {
  const foods = await prisma.mealFood.findMany({ where: { userId: req.userId }, orderBy: [{ group: 'asc' }, { name: 'asc' }] });
  res.json(foods);
});

router.post('/meal-foods', async (req, res) => {
  const data = mealFoodSchema.parse(req.body);
  const food = await prisma.mealFood.upsert({
    where: { userId_name_group: { userId: req.userId, name: data.name, group: data.group } },
    create: { ...data, userId: req.userId },
    update: { portion: data.portion, equivalents: data.equivalents },
  });
  res.status(201).json(food);
});

router.delete('/meal-foods/:foodId', async (req, res) => {
  const foodId = idSchema.parse(req.params.foodId);
  const result = await prisma.mealFood.deleteMany({ where: { id: foodId, userId: req.userId } });
  if (!result.count) return res.status(404).json({ error: 'Alimento no encontrado.' });
  res.status(204).end();
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
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      goal: true,
      status: true,
    },
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

router.get('/:id/meal-plans', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const patient = await prisma.patient.findFirst({ where: { id, userId: req.userId }, select: { id: true } });
  if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });
  const plans = await prisma.mealPlan.findMany({ where: { patientId: id }, orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }] });
  res.json(plans);
});

router.post('/:id/meal-plans', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const patient = await prisma.patient.findFirst({ where: { id, userId: req.userId }, select: { id: true } });
  if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });
  const data = mealPlanSchema.parse(req.body);
  const plan = await prisma.mealPlan.create({ data: { ...data, patientId: id } });
  res.status(201).json(plan);
});

router.put('/:id/meal-plans/:planId', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const planId = idSchema.parse(req.params.planId);
  const patient = await prisma.patient.findFirst({ where: { id, userId: req.userId }, select: { id: true } });
  if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });
  const data = mealPlanSchema.partial().parse(req.body);
  const exists = await prisma.mealPlan.findFirst({ where: { id: planId, patientId: id } });
  if (!exists) return res.status(404).json({ error: 'Plan no encontrado' });
  res.json(await prisma.mealPlan.update({ where: { id: planId }, data }));
});

router.delete('/:id/meal-plans/:planId', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const planId = idSchema.parse(req.params.planId);
  const patient = await prisma.patient.findFirst({ where: { id, userId: req.userId }, select: { id: true } });
  if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });
  const exists = await prisma.mealPlan.findFirst({ where: { id: planId, patientId: id } });
  if (!exists) return res.status(404).json({ error: 'Plan no encontrado' });
  await prisma.mealPlan.delete({ where: { id: planId } });
  res.status(204).end();
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
