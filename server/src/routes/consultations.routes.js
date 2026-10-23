import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/requireActiveSubscription.js';

const router = Router();
router.use(requireAuth, requireActiveSubscription);

const idSchema = z.coerce.number().int().positive();

const num = (min, max) =>
  z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.coerce.number().min(min).max(max).nullable().optional(),
  );

const MEASURE_KEYS = {
  basicas: ['tallaSentado', 'envergadura'],
  pliegues: [
    'triceps',
    'subescapular',
    'biceps',
    'crestaIliaca',
    'supraespinal',
    'abdominal',
    'muslo',
    'pierna',
  ],
  perimetros: [
    'brazoRelajado',
    'brazoContraido',
    'cintura',
    'cadera',
    'musloMedio',
    'piernaPerimetro',
  ],
  diametros: ['humero', 'biestiloideo', 'femur'],
};

const measureValue = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.coerce.number().min(0).max(300).nullable().optional(),
);

const measureGroup = (keys) =>
  z.object(Object.fromEntries(keys.map((k) => [k, measureValue]))).optional();

const measuresSchema = z
  .object(
    Object.fromEntries(
      Object.entries(MEASURE_KEYS).map(([group, keys]) => [
        group,
        measureGroup(keys),
      ]),
    ),
  )
  .optional();
const recallSchema = z
  .array(
    z.object({
      meal: z.string().trim().max(60),
      time: z.string().max(5).optional(),
      description: z.string().max(1500),
    }),
  )
  .max(12)
  .optional();

const frequencySchema = z
  .record(z.string().max(40), z.enum(['diario', '4-6', '1-3', 'rara', 'nunca']))
  .optional();
const dietCalculationSchema = z.object({
  formulaSex: z.enum(['F', 'M']).optional(),
  activityFactor: z.coerce.number().min(1).max(2).optional(),
  energyAdjustment: z.coerce.number().min(-100).max(200).optional(),
  targetWeight: z.preprocess((v) => v === '' || v === undefined ? undefined : v, z.coerce.number().min(1).max(500).optional()),
  caloriesOverride: z.preprocess((v) => v === '' || v === undefined ? undefined : v, z.coerce.number().min(1).max(10000).optional()),
  macroPct: z.object({ protein: z.coerce.number().min(0).max(100), carbs: z.coerce.number().min(0).max(100), fat: z.coerce.number().min(0).max(100) }).optional(),
}).optional();
const patientReportSchema = z.object({
  reason: z.string().max(1000).optional(),
  objective: z.string().max(1000).optional(),
  patientNote: z.string().max(2000).optional(),
  showMetrics: z.boolean().optional(),
  includeMacros: z.boolean().optional(),
  calories: z.string().max(80).optional(),
  macros: z.string().max(300).optional(),
  dietCalculation: dietCalculationSchema,
  hydration: z.string().max(1000).optional(),
  activity: z.string().max(1000).optional(),
  rest: z.string().max(1000).optional(),
  foodsToLimit: z.string().max(1000).optional(),
  supplements: z.string().max(1500).optional(),
  goals: z.string().max(2000).optional(),
  labs: z.string().max(1500).optional(),
  warningSigns: z.string().max(1500).optional(),
  rescheduleInfo: z.string().max(500).optional(),
}).optional();
const consultationSchema = z.object({
  date: z.coerce.date(),
  notes: z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().nullable().optional(),
  ),
  weightKg: num(1, 500),
  // A few older patient records contain height in metres (for example 1.65),
  // while consultations store it in centimetres. Normalize those values so
  // legacy data does not prevent an otherwise valid consultation from saving.
  heightCm: z.preprocess((value) => {
    if (value === '' || value === undefined || value === null) return null;
    const height = Number(value);
    return Number.isFinite(height) && height > 0 && height < 3
      ? height * 100
      : value;
  }, num(30, 260)),
  measures: measuresSchema,
  type: z.enum(['INITIAL', 'FOLLOWUP']).optional(),
  bodyFatPct: num(1, 80),
  recall24h: recallSchema,
  foodFrequency: frequencySchema,
  patientReport: patientReportSchema,
});

async function ownPatient(patientId, userId) {
  return prisma.patient.findFirst({ where: { id: patientId, userId } });
}

router.get('/patients/:patientId/consultations', async (req, res) => {
  const patientId = idSchema.parse(req.params.patientId);
  if (!(await ownPatient(patientId, req.userId)))
    return res.status(404).json({ error: 'Paciente no encontrado' });

  const consultations = await prisma.consultation.findMany({
    where: { patientId },
    orderBy: { date: 'asc' },
  });
  res.json(consultations);
});

router.post('/patients/:patientId/consultations', async (req, res) => {
  const patientId = idSchema.parse(req.params.patientId);
  if (!(await ownPatient(patientId, req.userId)))
    return res.status(404).json({ error: 'Paciente no encontrado' });

  const data = consultationSchema.parse(req.body);
  const created = await prisma.consultation.create({
    data: { ...data, patientId },
  });
  res.status(201).json(created);
});

router.get('/consultations/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const consultation = await prisma.consultation.findFirst({
    where: { id, patient: { userId: req.userId } },
  });
  if (!consultation)
    return res.status(404).json({ error: 'Consulta no encontrada' });
  res.json(consultation);
});

router.put('/consultations/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const data = consultationSchema.partial().parse(req.body);
  const exists = await prisma.consultation.findFirst({
    where: { id, patient: { userId: req.userId } },
  });
  if (!exists) return res.status(404).json({ error: 'Consulta no encontrada' });
  res.json(await prisma.consultation.update({ where: { id }, data }));
});

router.delete('/consultations/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const exists = await prisma.consultation.findFirst({
    where: { id, patient: { userId: req.userId } },
  });
  if (!exists) return res.status(404).json({ error: 'Consulta no encontrada' });
  await prisma.consultation.delete({ where: { id } });
  res.status(204).end();
});

export default router;
