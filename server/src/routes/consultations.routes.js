import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

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
const consultationSchema = z.object({
  date: z.coerce.date(),
  notes: z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().nullable().optional(),
  ),
  weightKg: num(1, 500),
  heightCm: num(30, 260),
  measures: measuresSchema,
  type: z.enum(['INITIAL', 'FOLLOWUP']).optional(),
  bodyFatPct: num(1, 80),
  recall24h: recallSchema,
  foodFrequency: frequencySchema,
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
