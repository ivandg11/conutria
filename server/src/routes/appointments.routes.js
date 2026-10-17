import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/requireActiveSubscription.js';

const router = Router();
router.use(requireAuth, requireActiveSubscription);

const idSchema = z.coerce.number().int().positive();
const dateSchema = z.coerce.date();
const normalizeName = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
const appointmentSchema = z.object({
  patientId: idSchema,
  startsAt: dateSchema,
  reason: z.preprocess(
    (value) => value === '' ? null : value,
    z.string().trim().max(191).nullable().optional(),
  ),
});

const includePatient = { patient: { select: { id: true, firstName: true, lastName: true, phone: true } } };

async function findBookablePatient(patientId, userId) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    include: { user: { select: { name: true } } },
  });
  if (!patient) return { status: 404, error: 'Paciente no encontrado.' };
  const patientName = normalizeName(`${patient.firstName} ${patient.lastName}`);
  const accountName = normalizeName(patient.user.name);
  if (patientName && patientName === accountName) return { status: 400, error: 'No puedes agendar una cita para tu propia cuenta.' };
  return { patient };
}

router.get('/', async (req, res) => {
  const range = z.object({ from: dateSchema, to: dateSchema }).safeParse(req.query);
  if (!range.success) return res.status(400).json({ error: 'Indica un rango de fechas válido.' });
  const { from, to } = range.data;
  if (from >= to) return res.status(400).json({ error: 'El rango de fechas no es válido.' });

  const appointments = await prisma.appointment.findMany({
    where: {
      startsAt: { gte: from, lt: to },
      patient: { userId: req.userId },
    },
    include: includePatient,
    orderBy: { startsAt: 'asc' },
  });
  res.json(appointments);
});

router.post('/', async (req, res) => {
  const data = appointmentSchema.parse(req.body);
  const result = await findBookablePatient(data.patientId, req.userId);
  if (result.error) return res.status(result.status).json({ error: result.error });
  const appointment = await prisma.appointment.create({ data, include: includePatient });
  res.status(201).json(appointment);
});

router.put('/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const data = appointmentSchema.parse(req.body);
  const [appointment, patientResult] = await Promise.all([
    prisma.appointment.findFirst({ where: { id, patient: { userId: req.userId } } }),
    findBookablePatient(data.patientId, req.userId),
  ]);
  if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });
  if (appointment.status === 'COMPLETED') return res.status(409).json({ error: 'No se puede modificar una cita finalizada.' });
  if (patientResult.error) return res.status(patientResult.status).json({ error: patientResult.error });
  res.json(await prisma.appointment.update({ where: { id }, data, include: includePatient }));
});

router.patch('/:id/status', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const { status } = z.object({ status: z.enum(['SCHEDULED', 'COMPLETED']) }).parse(req.body);
  const appointment = await prisma.appointment.findFirst({ where: { id, patient: { userId: req.userId } } });
  if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });
  if (appointment.status === 'COMPLETED' && status !== 'COMPLETED') return res.status(409).json({ error: 'Una cita finalizada no se puede reabrir.' });
  res.json(await prisma.appointment.update({ where: { id }, data: { status }, include: includePatient }));
});

router.delete('/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const appointment = await prisma.appointment.findFirst({ where: { id, patient: { userId: req.userId } } });
  if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });
  if (appointment.status === 'COMPLETED') return res.status(409).json({ error: 'No se puede eliminar una cita finalizada.' });
  await prisma.appointment.delete({ where: { id } });
  res.status(204).end();
});

export default router;
