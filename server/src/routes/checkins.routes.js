import { Router } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/requireActiveSubscription.js';
import { sendWeeklyCheckInEmail } from '../lib/email.js';

const router = Router();
const invitationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 6 });
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
const invitationExpiry = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

router.get('/patients/:patientId', requireAuth, requireActiveSubscription, async (req, res) => {
  const patientId = z.coerce.number().int().positive().parse(req.params.patientId);
  const patient = await prisma.patient.findFirst({ where: { id: patientId, userId: req.userId }, select: { id: true } });
  if (!patient) return res.status(404).json({ error: 'Paciente no encontrado.' });
  const checkIns = await prisma.weeklyCheckIn.findMany({
    where: { patientId },
    orderBy: { submittedAt: 'desc' },
    take: 20,
    select: { id: true, adherence: true, energy: true, hunger: true, challenges: true, submittedAt: true, reviewedAt: true, reviewNotes: true },
  });
  res.json(checkIns);
});

router.post('/patients/:patientId/invitations', requireAuth, requireActiveSubscription, invitationLimiter, async (req, res) => {
  const patientId = z.coerce.number().int().positive().parse(req.params.patientId);
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId: req.userId },
    select: { id: true, firstName: true, email: true, status: true },
  });
  if (!patient) return res.status(404).json({ error: 'Paciente no encontrado.' });
  if (patient.status !== 'ACTIVE') return res.status(409).json({ error: 'Reactiva al paciente antes de enviarle un seguimiento.' });
  if (!patient.email) return res.status(409).json({ error: 'Agrega un correo al paciente para enviarle el seguimiento semanal.' });
  const nutritionist = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true } });
  const rawToken = randomBytes(32).toString('base64url');
  const invitation = await prisma.checkInInvitation.create({
    data: { patientId, tokenHash: tokenHash(rawToken), expiresAt: invitationExpiry() },
    select: { id: true, expiresAt: true },
  });
  try {
    await sendWeeklyCheckInEmail(patient, nutritionist?.name ?? 'Tu nutriólogo', rawToken);
  } catch (error) {
    await prisma.checkInInvitation.delete({ where: { id: invitation.id } }).catch(() => {});
    console.error('No se pudo enviar el seguimiento semanal:', error.message);
    return res.status(502).json({ error: 'No se pudo enviar el correo. Revisa la configuración de correo e inténtalo de nuevo.' });
  }
  await prisma.auditLog.create({ data: { actorId: req.userId, action: 'Envió seguimiento semanal', details: `Paciente ${patientId}` } });
  await prisma.checkInInvitation.updateMany({
    where: { patientId, id: { not: invitation.id }, usedAt: null, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() },
  });
  res.status(201).json({ ok: true, expiresAt: invitation.expiresAt });
});

router.post('/public/lookup', publicLimiter, async (req, res) => {
  const { token } = z.object({ token: z.string().min(32).max(64) }).parse(req.body);
  const invitation = await prisma.checkInInvitation.findFirst({
    where: { tokenHash: tokenHash(token), usedAt: null, expiresAt: { gt: new Date() } },
    select: { expiresAt: true, patient: { select: { firstName: true, user: { select: { name: true } } } } },
  });
  if (!invitation) return res.status(404).json({ error: 'Este enlace ya se usó o venció. Pide uno nuevo a tu nutriólogo.' });
  res.json({ firstName: invitation.patient.firstName, nutritionistName: invitation.patient.user.name, expiresAt: invitation.expiresAt });
});

router.post('/public/submit', publicLimiter, async (req, res) => {
  const values = z.object({
    token: z.string().min(32).max(64),
    adherence: z.number().int().min(1).max(5),
    energy: z.number().int().min(1).max(5),
    hunger: z.number().int().min(1).max(5),
    challenges: z.string().trim().max(500).optional().default(''),
    consent: z.literal(true),
  }).parse(req.body);
  const now = new Date();
  const tokenDigest = tokenHash(values.token);
  const invitation = await prisma.checkInInvitation.findFirst({
    where: { tokenHash: tokenDigest, usedAt: null, expiresAt: { gt: now } },
    select: { id: true, patientId: true },
  });
  if (!invitation) return res.status(404).json({ error: 'Este enlace ya se usó o venció. Pide uno nuevo a tu nutriólogo.' });

  const submitted = await prisma.$transaction(async (tx) => {
    const claimed = await tx.checkInInvitation.updateMany({
      where: { id: invitation.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;
    await tx.weeklyCheckIn.create({
      data: {
        invitationId: invitation.id,
        patientId: invitation.patientId,
        adherence: values.adherence,
        energy: values.energy,
        hunger: values.hunger,
        challenges: values.challenges || null,
        consentAcceptedAt: now,
      },
    });
    return true;
  });
  if (!submitted) return res.status(409).json({ error: 'Este seguimiento ya fue respondido.' });
  res.status(201).json({ ok: true });
});

router.patch('/patients/:patientId/:checkInId/review', requireAuth, requireActiveSubscription, async (req, res) => {
  const patientId = z.coerce.number().int().positive().parse(req.params.patientId);
  const checkInId = z.coerce.number().int().positive().parse(req.params.checkInId);
  const { reviewNotes } = z.object({ reviewNotes: z.string().trim().max(1000).optional().default('') }).parse(req.body);
  const checkIn = await prisma.weeklyCheckIn.findFirst({
    where: { id: checkInId, patientId, patient: { userId: req.userId } },
    select: { id: true },
  });
  if (!checkIn) return res.status(404).json({ error: 'No encontramos este seguimiento.' });
  const updated = await prisma.weeklyCheckIn.update({
    where: { id: checkInId },
    data: { reviewedAt: new Date(), reviewNotes: reviewNotes || null },
    select: { id: true, reviewedAt: true, reviewNotes: true },
  });
  await prisma.auditLog.create({ data: { actorId: req.userId, action: 'Revisó seguimiento semanal', details: `Check-in ${checkInId}; paciente ${patientId}` } });
  res.json(updated);
});

export default router;
