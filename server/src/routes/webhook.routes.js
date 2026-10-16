import { Router } from 'express';
import {
  createHmac,
  timingSafeEqual,
  randomBytes,
  createHash,
} from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { sendWelcomeEmail as sendWelcomeMessage } from '../lib/email.js';

const router = Router();
const plans = {
  MONTHLY: { price: 199, months: 1 },
  ANNUAL: { price: 1990, months: 12 },
};

function validSignature(req, queryDataId) {
  const signature = req.get('x-signature')?.trim();
  const requestId = req.get('x-request-id')?.trim();
  const liveMode = req.body?.live_mode;
  const secretVariable =
    liveMode === true
      ? 'MP_WEBHOOK_SECRET_PROD'
      : liveMode === false
        ? 'MP_WEBHOOK_SECRET_TEST'
        : 'MP_WEBHOOK_SECRET';
  const configuredSecretVariable = process.env[secretVariable]
    ? secretVariable
    : process.env.MP_WEBHOOK_SECRET
      ? 'MP_WEBHOOK_SECRET'
      : null;
  const secret = configuredSecretVariable
    ? process.env[configuredSecretVariable]
    : '';
  const missing = [
    !signature && 'x-signature',
    !secret && secretVariable,
  ].filter(Boolean);
  if (missing.length) {
    console.error(
      'Webhook de Mercado Pago rechazado; faltan datos:',
      missing.join(', '),
    );
    return false;
  }
  const fields = {};
  for (const part of signature.split(',')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim().toLowerCase();
    const value = part.slice(separator + 1).trim();
    if (key && value) fields[key] = value;
  }
  if (!fields.ts || !fields.v1) {
    console.error(
      'Webhook de Mercado Pago rechazado: formato de firma incompleto.',
    );
    return false;
  }
  // Preserve data.id exactly as received in the signature manifest.
  // Keep the original ID elsewhere for the payment API request.
  const manifestParts = [];
  if (
    queryDataId !== undefined &&
    queryDataId !== null &&
    String(queryDataId).trim()
  )
    manifestParts.push(`id:${String(queryDataId).trim()}`);
  if (requestId) manifestParts.push(`request-id:${requestId}`);
  manifestParts.push(`ts:${fields.ts}`);
  const manifest = `${manifestParts.join(';')};`;
  if (!/^[a-f\d]{64}$/i.test(fields.v1)) {
    console.error(
      'Webhook de Mercado Pago rechazado: firma con formato inválido.',
    );
    return false;
  }
  const expected = createHmac('sha256', secret).update(manifest).digest();
  const received = Buffer.from(fields.v1, 'hex');
  const isValid =
    received.length === expected.length && timingSafeEqual(received, expected);
  if (!isValid) {
    const matchesCandidate = (candidate) => {
      const digest = createHmac('sha256', secret).update(candidate).digest();
      return (
        received.length === digest.length && timingSafeEqual(received, digest)
      );
    };
    const id = String(queryDataId ?? '').trim();
    const tsPart = `ts:${fields.ts};`;
    const withoutRequestId = `${id ? `id:${id};` : ''}${tsPart}`;
    const bodyId = String(req.body?.data?.id ?? '').trim();
    const withBodyId = `${bodyId ? `id:${bodyId};` : ''}${requestId ? `request-id:${requestId};` : ''}${tsPart}`;
    const tokenApplicationId = process.env.MP_ACCESS_TOKEN?.match(
      /^(?:APP_USR|TEST)-(\d+)-/,
    )?.[1];
    const eventApplicationId =
      req.body?.application_id == null ? null : String(req.body.application_id);
    console.error('Webhook de Mercado Pago rechazado: la firma no coincide.', {
      queryDataIdPresent: Boolean(queryDataId),
      bodyDataIdPresent: Boolean(req.body?.data?.id),
      queryAndBodyDataIdMatch: bodyId ? bodyId === id : null,
      requestIdPresent: Boolean(requestId),
      requestId: requestId ?? null,
      secretConfigured: Boolean(secret),
      secretHasEdgeWhitespace: Boolean(secret && secret !== secret.trim()),
      secretVariableUsed: configuredSecretVariable,
      secretMode:
        liveMode === true
          ? 'production'
          : liveMode === false
            ? 'test'
            : 'unspecified',
      signatureTimestampPresent: Boolean(fields.ts),
      signatureTimestamp: fields.ts,
      signatureManifest: manifest,
      signatureHashPresent: Boolean(fields.v1),
      dataIdHadUppercase: Boolean(id && id !== id.toLowerCase()),
      signatureMatchesWithoutRequestId:
        Boolean(requestId) && matchesCandidate(withoutRequestId),
      signatureMatchesBodyDataId:
        Boolean(bodyId) && bodyId !== id && matchesCandidate(withBodyId),
      eventType: req.body?.type ?? null,
      eventAction: req.body?.action ?? null,
      liveMode:
        typeof req.body?.live_mode === 'boolean' ? req.body.live_mode : null,
      applicationIdMatchesAccessToken:
        tokenApplicationId && eventApplicationId
          ? tokenApplicationId === eventApplicationId
          : null,
    });
  }
  return isValid;
}

async function sendSetupEmail(user, rawToken) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, '');
  if (!apiKey || !from || !clientUrl)
    throw new Error('Falta configurar el servicio de correo.');

  const url = `${clientUrl}/crear-contrasena?token=${encodeURIComponent(rawToken)}`;
  const safeName = String(user.name ?? '').replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  );
  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f4f7f3;font-family:Arial,Helvetica,sans-serif;color:#193d35;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Te damos la bienvenida a Conutria. Tu suscripción está confirmada; activa tu cuenta.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f3;padding:36px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e0e7de;border-radius:20px;overflow:hidden;">
          <tr><td style="padding:28px 32px;background:#103f34;color:#ffffff;text-align:center;">
            <div style="font-size:12px;font-weight:700;letter-spacing:3px;color:#9de0c2;">Conutria</div>
            <div style="margin-top:12px;font-size:24px;font-weight:700;line-height:1.3;">¡Te damos la bienvenida!</div>
          </td></tr>
          <tr><td style="padding:32px;color:#193d35;">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Hola ${safeName},</p>
            <p style="margin:0 0 24px;color:#627970;font-size:15px;line-height:1.7;">Confirmamos tu suscripción. Crea una contraseña para activar tu cuenta y comenzar a organizar tu consulta nutricional.</p>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 22px;"><tr><td align="center" style="border-radius:10px;background:#f8cb59;">
              <a href="${url}" style="display:inline-block;padding:15px 28px;color:#103f34;font-size:15px;font-weight:700;text-decoration:none;">Crear mi contraseña</a>
            </td></tr></table>
            <p style="margin:0;color:#71847c;font-size:13px;line-height:1.6;text-align:center;">Este enlace es de un solo uso y vence en 36 horas.</p>
            <p style="margin:22px 0 0;color:#71847c;font-size:12px;line-height:1.6;">Si el botón no funciona, copia este enlace en tu navegador:<br><a href="${url}" style="color:#0e8060;word-break:break-all;">${url}</a></p>
          </td></tr>
          <tr><td style="padding:18px 32px;border-top:1px solid #edf1ec;color:#87978f;font-size:12px;line-height:1.6;text-align:center;">Conutria · Herramientas para una consulta más organizada</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  const text = `Hola ${user.name},\n\nTe damos la bienvenida a Conutria. Confirmamos tu suscripción. Crea una contraseña para activar tu cuenta: ${url}\n\nEl enlace es de un solo uso y vence en 36 horas.`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [user.email],
      subject: 'Te damos la bienvenida a Conutria',
      html,
      text,
    }),
  });
  if (!response.ok)
    throw new Error(`Resend rechazó el correo (${response.status}).`);
}

router.post('/mercadopago', async (req, res) => {
  // This endpoint provisions signups only from approved payment notifications.
  // Merchant-order events are unrelated to that flow and must not be fetched as payments.
  if (req.body?.type && req.body.type !== 'payment') {
    console.info('Webhook de Mercado Pago ignorado: tipo no procesado.', {
      eventType: req.body.type,
      eventAction: req.body.action ?? null,
    });
    return res.sendStatus(200);
  }
  const queryDataId = req.query['data.id'];
  const dataId = queryDataId ?? req.body?.data?.id;
  // A notification without a resource ID cannot be processed as a payment.
  // Acknowledge it so non-payment probes do not create misleading retries.
  if (!dataId) {
    const isLegacyIpn = req.query.id != null || req.query.topic != null;
    console.warn(
      isLegacyIpn
        ? 'Notificación IPN antigua de Mercado Pago ignorada; se espera Webhook con data.id.'
        : 'Webhook de Mercado Pago ignorado: no contiene data.id.',
      {
        queryKeys: Object.keys(req.query),
        bodyType: req.body?.type ?? null,
        bodyAction: req.body?.action ?? null,
        bodyHasData: Boolean(req.body?.data),
      },
    );
    return res.sendStatus(200);
  }
  if (!validSignature(req, queryDataId))
    return res.status(401).json({ error: 'Firma de webhook invÃ¡lida.' });
  if (!process.env.MP_ACCESS_TOKEN)
    return res.status(503).json({ error: 'Webhook no configurado.' });
  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`,
      {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      },
    );
    if (!response.ok)
      throw new Error(`Mercado Pago respondiÃ³ ${response.status}.`);
    const payment = await response.json();
    if (String(payment.id) !== String(dataId)) {
      console.error('Webhook rechazado: el ID de pago consultado no coincide.', {
        notificationDataId: String(dataId),
        providerPaymentId: String(payment.id),
      });
      return res.status(400).json({ error: 'Pago no coincide.' });
    }
    if (payment.status !== 'approved') {
      if (payment.external_reference)
        await prisma.pendingSignup.updateMany({
          where: { id: String(payment.external_reference), status: 'PENDING' },
          data: {
            status:
              payment.status === 'rejected' ? 'PAYMENT_FAILED' : 'PENDING',
          },
        });
      return res.sendStatus(200);
    }

    const pendingId = String(payment.external_reference || '');
    const pending = await prisma.pendingSignup.findUnique({
      where: { id: pendingId },
    });
    if (!pending) return res.status(200).json({ received: true });
    if (pending.status === 'COMPLETED') return res.sendStatus(200);
    if (pending.expiresAt <= new Date()) {
      await prisma.pendingSignup.update({
        where: { id: pending.id },
        data: { status: 'EXPIRED' },
      });
      return res.sendStatus(200);
    }
    const plan = plans[pending.plan];
    if (
      !plan ||
      payment.currency_id !== 'MXN' ||
      Number(payment.transaction_amount) !== plan.price ||
      Number(pending.amount) !== plan.price
    ) {
      console.error('Webhook rechazado: los datos del pago no coinciden con el plan.', {
        paymentId: String(payment.id),
        plan: pending.plan,
        paymentCurrency: payment.currency_id ?? null,
        paymentAmount: payment.transaction_amount ?? null,
        expectedAmount: plan?.price ?? null,
        pendingAmount: pending.amount,
      });
      return res
        .status(400)
        .json({ error: 'Los datos del pago no coinciden con el plan.' });
    }
    // Mercado Pago may omit preference_id from a payment response. When present,
    // still reject a preference that conflicts with the pending signup.
    if (
      pending.providerPreferenceId &&
      payment.preference_id != null &&
      String(payment.preference_id) !== pending.providerPreferenceId
    ) {
      console.error('Webhook rechazado: la preferencia del pago no coincide.', {
        paymentId: String(payment.id),
        pendingSignupId: pending.id,
        paymentPreferenceId: payment.preference_id ?? null,
        expectedPreferenceId: pending.providerPreferenceId,
      });
      return res
        .status(400)
        .json({ error: 'La preferencia de pago no coincide con el registro.' });
    }
    if (
      pending.status === 'PROCESSING' &&
      pending.processingStartedAt &&
      Date.now() - pending.processingStartedAt.getTime() < 5 * 60 * 1000
    )
      return res.sendStatus(200);
    if (pending.status !== 'PROCESSING') {
      const claim = await prisma.pendingSignup.updateMany({
        where: {
          id: pending.id,
          status: { in: ['PENDING', 'PAYMENT_FAILED', 'PAID'] },
        },
        data: {
          status: 'PROCESSING',
          paidAt: payment.date_approved
            ? new Date(payment.date_approved)
            : new Date(),
          processingStartedAt: new Date(),
        },
      });
      if (!claim.count) return res.sendStatus(200);
    } else {
      await prisma.pendingSignup.update({
        where: { id: pending.id },
        data: { processingStartedAt: new Date() },
      });
    }

    const existingUser = pending.userId
      ? await prisma.user.findUnique({ where: { id: pending.userId } })
      : await prisma.user.findUnique({ where: { email: pending.email } });
    if (existingUser && existingUser.email !== pending.email) {
      await prisma.pendingSignup.update({
        where: { id: pending.id },
        data: { status: 'EMAIL_CONFLICT', processingStartedAt: null },
      });
      return res.sendStatus(200);
    }
    if (existingUser && !pending.userId) {
      await prisma.pendingSignup.update({
        where: { id: pending.id },
        data: { status: 'EMAIL_CONFLICT', processingStartedAt: null },
      });
      return res.sendStatus(200);
    }
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const startedAt = payment.date_approved
      ? new Date(payment.date_approved)
      : new Date();
    const renewsAt = new Date(startedAt);
    renewsAt.setMonth(renewsAt.getMonth() + plan.months);
    const user =
      existingUser ||
      (await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            name: pending.name,
            email: pending.email,
            passwordHash: null,
            role: 'NUTRITIONIST',
          },
        });
        const subscription = await tx.subscription.create({
          data: {
            userId: createdUser.id,
            plan: pending.plan,
            status: 'ACTIVE',
            price: plan.price,
            startedAt,
            renewsAt,
          },
        });
        await tx.payment.create({
          data: {
            subscriptionId: subscription.id,
            amount: plan.price,
            status: 'PAID',
            paidAt: startedAt,
            dueAt: startedAt,
            providerPaymentId: String(payment.id),
          },
        });
        await tx.passwordSetupToken.deleteMany({
          where: { userId: createdUser.id, usedAt: null },
        });
        await tx.passwordSetupToken.create({
          data: {
            userId: createdUser.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000),
          },
        });
        await tx.pendingSignup.update({
          where: { id: pending.id },
          data: {
            status: 'PROCESSING',
            userId: createdUser.id,
            paidAt: startedAt,
            processingStartedAt: new Date(),
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: createdUser.id,
            action: 'Cuenta creada por pago aprobado',
            details: `Plan ${pending.plan}; pago ${payment.id}`,
          },
        });
        return createdUser;
      }));
    if (existingUser) {
      await prisma.$transaction(async (tx) => {
        await tx.passwordSetupToken.deleteMany({
          where: { userId: existingUser.id, usedAt: null },
        });
        await tx.passwordSetupToken.create({
          data: {
            userId: existingUser.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000),
          },
        });
        await tx.pendingSignup.update({
          where: { id: pending.id },
          data: { status: 'PROCESSING', processingStartedAt: new Date() },
        });
      });
    }
    try {
      await sendWelcomeMessage(user, rawToken);
      await prisma.pendingSignup.update({
        where: { id: pending.id },
        data: {
          status: 'COMPLETED',
          emailSentAt: new Date(),
          processingStartedAt: null,
        },
      });
    } catch (emailError) {
      await prisma.pendingSignup.update({
        where: { id: pending.id },
        data: { status: 'PAID', processingStartedAt: null },
      });
      console.error(
        'Pago aplicado, pero no se pudo enviar el enlace de contraseÃ±a:',
        emailError.message,
      );
      return res
        .status(503)
        .json({ error: 'No se pudo completar el envÃ­o del correo.' });
    }
    return res.sendStatus(200);
  } catch (error) {
    console.error('Error procesando webhook de Mercado Pago:', error.message);
    return res
      .status(500)
      .json({ error: 'Error temporal al procesar el pago.' });
  }
});

export default router;
